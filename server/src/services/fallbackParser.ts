import { AIIntent, ParsedParkingIntent } from "../types/index.js";

/**
 * Deterministic regex-based fallback parser.
 * Used when Gemini API is unavailable or returns an unparseable response.
 * Never makes API calls — works fully offline.
 */

// ── Location aliases ─────────────────────────────────────────────────────────
const LOCATION_ALIASES: Record<string, string> = {
  "phoenix": "Phoenix Marketcity Mall - Kurla",
  "phoenix marketcity": "Phoenix Marketcity Mall - Kurla",
  "marketcity": "Phoenix Marketcity Mall - Kurla",
  "kurla": "Phoenix Marketcity Mall - Kurla",
  "jio world": "Jio World Centre - BKC",
  "jio world centre": "Jio World Centre - BKC",
  "jio": "Jio World Centre - BKC",
  "bkc": "Jio World Centre - BKC",
  "bandra kurla": "Jio World Centre - BKC",
  "inorbit": "Inorbit Mall & PVR Cinemas - Malad",
  "malad": "Inorbit Mall & PVR Cinemas - Malad",
  "pvr": "Inorbit Mall & PVR Cinemas - Malad",
};

// ── Vehicle type keywords ─────────────────────────────────────────────────────
const VEHICLE_KEYWORDS: Record<string, string> = {
  "bike": "BIKE",
  "motorcycle": "BIKE",
  "two wheeler": "BIKE",
  "scooter": "BIKE",
  "car": "CAR",
  "sedan": "CAR",
  "hatchback": "CAR",
  "suv": "SUV",
  "crossover": "SUV",
  "ev": "EV",
  "electric": "EV",
  "electric vehicle": "EV",
  "tesla": "EV",
};

// ── Intent keywords ───────────────────────────────────────────────────────────
function detectIntent(text: string): AIIntent {
  const lower = text.toLowerCase();
  if (/extend|extra time|more time|additional hour|stay longer|few more hours/.test(lower))
    return AIIntent.EXTEND_BOOKING;
  if (/cancel|refund|cancel my booking/.test(lower))
    return AIIntent.CANCEL_BOOKING;
  if (/show my bookings|my bookings|booking history|past bookings|list bookings|all my bookings/.test(lower))
    return AIIntent.BOOKING_HELP;
  if (/when does|when is my|check booking|booking status|my ticket|where is my car|what's my.*slot|what is my.*slot|my slot|time remaining|my active booking/.test(lower))
    return AIIntent.CHECK_BOOKING;
  if (/how does|how do i|what payment|can i reserve|how to|about park ease|qr code|help/.test(lower))
    return AIIntent.GENERAL_HELP;
  if (/paid|amount|payment|how much|cost|price|receipt/.test(lower) && !/book|park/.test(lower))
    return AIIntent.BOOKING_HELP;
  if (/book|parking|park|reserve|need a slot|find.*slot|looking for.*spot|find.*parking/.test(lower))
    return AIIntent.SEARCH_PARKING;
  if (/booking|reservation/.test(lower))
    return AIIntent.BOOKING_HELP;
  return AIIntent.SEARCH_PARKING;
}

// ── Date extraction ───────────────────────────────────────────────────────────
function extractDate(text: string): string | undefined {
  const lower = text.toLowerCase();
  const today = new Date();

  if (/\btoday\b/.test(lower)) {
    return toDateStr(today);
  }
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return toDateStr(d);
  }

  // Day of week
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const d = new Date(today);
      const diff = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return toDateStr(d);
    }
  }

  // Explicit date: DD/MM/YYYY or YYYY-MM-DD
  const dmyMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // ISO: YYYY-MM-DD
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  return undefined;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Time extraction ───────────────────────────────────────────────────────────
function extractTime(text: string): string | undefined {
  // "7:30 PM", "7:30PM", "7 PM", "19:00", "7pm"
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const min = parseInt(timeMatch[2] || "0");
    const meridiem = timeMatch[3].toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  // 24-hr: "19:00"
  const h24 = text.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
  if (h24) return `${h24[1]}:${h24[2]}`;
  return undefined;
}

// ── Duration extraction ───────────────────────────────────────────────────────
function extractDuration(text: string): number | undefined {
  // "3 hours", "2 hrs", "half an hour", "30 minutes"
  const hrMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hours|hrs)/i);
  if (hrMatch) return parseFloat(hrMatch[1]);

  const minMatch = text.match(/(\d+)\s*(?:minute|min|minutes|mins)/i);
  if (minMatch) return parseFloat((parseInt(minMatch[1]) / 60).toFixed(2));

  // "from X to Y" style duration
  const fromTo = text.match(/from\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+to\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (fromTo) {
    const start = extractTime(fromTo[1]);
    const end = extractTime(fromTo[2]);
    if (start && end) {
      const sh = parseInt(start.split(":")[0]), sm = parseInt(start.split(":")[1]);
      const eh = parseInt(end.split(":")[0]), em = parseInt(end.split(":")[1]);
      const diff = (eh * 60 + em - sh * 60 - sm) / 60;
      if (diff > 0) return Math.round(diff * 100) / 100;
    }
  }
  return undefined;
}

// ── End time from duration + start ───────────────────────────────────────────
function computeEndTime(
  dateStr: string,
  startStr: string,
  durationHours: number
): { startISO: string; endISO: string } {
  const [sh, sm] = startStr.split(":").map(Number);
  const start = new Date(`${dateStr}T${startStr.padStart(5, "0")}:00.000Z`);
  // Treat as local time by offsetting
  const startLocal = new Date(`${dateStr}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`);
  const endLocal = new Date(startLocal.getTime() + durationHours * 60 * 60 * 1000);
  return {
    startISO: startLocal.toISOString(),
    endISO: endLocal.toISOString(),
  };
}

// ── Location matching ─────────────────────────────────────────────────────────
function extractDestination(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  // Check if user specified a named location like "at <Place>" or "near <Place>" or "to <Place>"
  const locMatch = text.match(/(?:at|near|around|to)\s+([A-Za-z0-9\s\-]+?)(?:\s+(?:tomorrow|today|yesterday|on|for|\bwith\b|\d{1,2}(?::\d{2})?\s*(?:am|pm)?|$))/i);
  if (locMatch && locMatch[1].trim().length > 2) {
    const candidate = locMatch[1].trim();
    const stopWords = ["parking", "a slot", "a spot", "my car", "an ev", "my suv", "my bike"];
    if (!stopWords.some((w) => candidate.toLowerCase().includes(w))) {
      return candidate;
    }
  }
  return undefined;
}

// ── Vehicle type ──────────────────────────────────────────────────────────────
function extractVehicleType(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, type] of Object.entries(VEHICLE_KEYWORDS)) {
    if (lower.includes(keyword)) return type;
  }
  return undefined;
}

// ── EV charging requirement ───────────────────────────────────────────────────
function extractEVRequirement(text: string): boolean {
  const lower = text.toLowerCase();
  return /\bev\b|electric|charging|charger|charge\b|ev\s+charging|ev\s+slot/.test(lower);
}

// ── Additional duration for EXTEND_BOOKING ────────────────────────────────────
function extractAdditionalDuration(text: string): number | undefined {
  const lower = text.toLowerCase();
  if (/another|extra|more|additional/.test(lower)) {
    return extractDuration(text);
  }
  return undefined;
}

// ── Main fallback parser ──────────────────────────────────────────────────────
export function fallbackParser(
  userMessage: string,
  partialIntent?: Partial<ParsedParkingIntent>
): ParsedParkingIntent {
  const intent = detectIntent(userMessage);
  const destination = extractDestination(userMessage) ?? partialIntent?.destination;
  const date = extractDate(userMessage) ?? partialIntent?.date;
  const startTime = extractTime(userMessage) ?? partialIntent?.startTime;
  const duration = extractDuration(userMessage) ?? partialIntent?.durationHours;
  const vehicleType = extractVehicleType(userMessage) ?? partialIntent?.vehicleType;
  const requiresEVCharging = extractEVRequirement(userMessage) || partialIntent?.requiresEVCharging || false;
  const additionalDuration = extractAdditionalDuration(userMessage) ?? partialIntent?.additionalDuration;

  // Determine which key fields are still missing
  const missingFields: string[] = [];
  if (intent === AIIntent.SEARCH_PARKING) {
    if (!destination) missingFields.push("destination");
    if (!date) missingFields.push("date");
    if (!startTime) missingFields.push("startTime");
    if (!vehicleType) missingFields.push("vehicleType");
    if (!duration) missingFields.push("durationHours");
  }

  return {
    intent,
    destination,
    date,
    startTime,
    durationHours: duration,
    vehicleType,
    requiresEVCharging,
    additionalDuration,
    userMessage,
    missingFields,
    confidence: missingFields.length === 0 ? "HIGH" : missingFields.length <= 2 ? "MEDIUM" : "LOW",
    parserUsed: "fallback",
  };
}

export { computeEndTime, LOCATION_ALIASES };
