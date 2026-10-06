import { GoogleGenAI } from "@google/genai";
import { AIIntent, ParsedParkingIntent } from "../types/index.js";
import { fallbackParser } from "./fallbackParser.js";

/**
 * Isolated AI provider service for Park Ease.
 * Primary: Google Gemini Flash.
 * Fallback: deterministic regex parser (never makes external calls).
 *
 * API key is read from GEMINI_API_KEY environment variable.
 * Never hard-coded.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Park Ease system context injected into every Gemini call
const SYSTEM_CONTEXT = `You are ParkEase AI, the smart parking assistant for Park Ease — a smart parking reservation platform in Mumbai, India.

Park Ease has these parking locations:
1. Phoenix Marketcity Mall - Kurla, Mumbai (₹60/hr) — Floors G, 1, 2. Has EV charging.
2. Jio World Centre - BKC, Mumbai (₹100/hr) — Floors G, 1. Has EV fast charging.
3. Inorbit Mall & PVR Cinemas - Malad, Mumbai (₹50/hr) — Floors G, 1. Has EV charging.

Supported vehicle types: CAR, SUV, BIKE, EV

Your job is to extract structured parking intent from user messages.
Today's date is: ${new Date().toISOString().slice(0, 10)}

Respond ONLY with a valid JSON object (no markdown, no explanation), matching this schema:
{
  "intent": "SEARCH_PARKING | BOOKING_HELP | EXTEND_BOOKING | CANCEL_BOOKING | CHECK_BOOKING | GENERAL_HELP",
  "destination": "exact location name or null",
  "date": "YYYY-MM-DD or null",
  "startTime": "HH:MM (24-hr) or null",
  "endTime": "HH:MM (24-hr) or null",
  "durationHours": number or null,
  "vehicleType": "CAR | SUV | BIKE | EV or null",
  "requiresEVCharging": boolean,
  "floorPreference": "G | 1 | 2 or null",
  "additionalDuration": number or null,
  "userMessage": "brief clarified summary of what user wants",
  "missingFields": ["list of fields still needed"],
  "confidence": "HIGH | MEDIUM | LOW"
}

Rules:
- destination MUST exactly match one of the 3 locations listed above, or be null
- Never invent locations, bookings, or availability
- For "tomorrow", resolve to actual YYYY-MM-DD relative to today
- For time ranges like "5 to 8 PM", set startTime="17:00", endTime="20:00", durationHours=3
- For EV vehicle type OR "ev charging" requests, set requiresEVCharging=true
- missingFields should list what's needed to make a SEARCH_PARKING query actionable
`;

function isGeminiConfigured(): boolean {
  return typeof GEMINI_API_KEY === "string" && GEMINI_API_KEY.trim().length > 0;
}

/**
 * Call Gemini Flash to parse a natural-language parking request.
 * Returns a ParsedParkingIntent or throws if unavailable/unparseable.
 */
export async function parseWithGemini(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  partialIntent?: Partial<ParsedParkingIntent>
): Promise<ParsedParkingIntent> {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });

  // Build conversation prompt including prior messages for context
  const historyText = conversationHistory
    .slice(-6) // Keep last 3 turns to stay within token limits
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const partialContext = partialIntent
    ? `\nPreviously gathered context: ${JSON.stringify(partialIntent)}`
    : "";

  const prompt = `${SYSTEM_CONTEXT}${partialContext}

${historyText ? `Conversation so far:\n${historyText}\n\n` : ""}Current message: "${userMessage}"

Extract the structured parking intent from the above.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const text = response.text?.trim() ?? "";

  // Strip markdown code fences if present
  const jsonText = text
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`GEMINI_PARSE_ERROR: could not parse JSON from Gemini response: ${text.slice(0, 200)}`);
  }

  // Validate and normalise the intent field
  const validIntents = Object.values(AIIntent);
  const intentRaw = String(parsed.intent ?? "").toUpperCase();
  const intent = validIntents.includes(intentRaw as AIIntent)
    ? (intentRaw as AIIntent)
    : AIIntent.SEARCH_PARKING;

  return {
    intent,
    destination: parsed.destination ?? undefined,
    date: parsed.date ?? undefined,
    startTime: parsed.startTime ?? undefined,
    endTime: parsed.endTime ?? undefined,
    durationHours: typeof parsed.durationHours === "number" ? parsed.durationHours : undefined,
    vehicleType: parsed.vehicleType
      ? String(parsed.vehicleType).toUpperCase()
      : undefined,
    requiresEVCharging: Boolean(parsed.requiresEVCharging),
    floorPreference: parsed.floorPreference ?? undefined,
    additionalDuration:
      typeof parsed.additionalDuration === "number" ? parsed.additionalDuration : undefined,
    userMessage: parsed.userMessage ?? userMessage,
    missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(parsed.confidence) ? parsed.confidence : "MEDIUM") as
      | "HIGH"
      | "MEDIUM"
      | "LOW",
    parserUsed: "gemini",
  };
}

/**
 * Primary entry point for intent parsing.
 * Tries Gemini first; falls back to the deterministic regex parser if:
 *   - Gemini is not configured (no API key)
 *   - Gemini returns an error or unparseable JSON
 * Never throws to the caller — always returns a ParsedParkingIntent.
 */
export async function parseIntent(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  partialIntent?: Partial<ParsedParkingIntent>
): Promise<ParsedParkingIntent & { geminiUnavailable?: boolean }> {
  if (isGeminiConfigured()) {
    try {
      const result = await parseWithGemini(userMessage, conversationHistory, partialIntent);
      return result;
    } catch (err: any) {
      console.warn("[AI Service] Gemini unavailable, using fallback parser:", err.message);
    }
  }

  // Use deterministic fallback
  const fallback = fallbackParser(userMessage, partialIntent);
  return { ...fallback, geminiUnavailable: !isGeminiConfigured() };
}

export { isGeminiConfigured };
