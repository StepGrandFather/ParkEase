import { Request, Response } from "express";
import { prisma } from "../db.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { parseIntent } from "../services/aiService.js";
import { matchLocation } from "../services/locationMatchService.js";
import { getAIRecommendations } from "../services/recommendationService.js";
import { calculateParkingFee } from "../services/pricingService.js";
import {
  AIIntent,
  AIChatResponse,
  ParsedParkingIntent,
} from "../types/index.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDateTime(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d;
}

function computeEndFromDuration(startTime: Date, durationHours: number): Date {
  return new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
}

function getMissingFieldsQuestion(missing: string[]): string {
  const fieldLabels: Record<string, string> = {
    destination: "Which parking location are you going to? (e.g. Phoenix Marketcity, Jio World Centre, or Inorbit Mall)",
    date: "What date do you need parking? (e.g. today, tomorrow, or a specific date)",
    startTime: "What time will you arrive? (e.g. 7 PM, 6:30 PM)",
    vehicleType: "What type of vehicle are you bringing? (Car, SUV, Bike, or EV)",
    durationHours: "How long do you plan to stay? (e.g. 2 hours, 3 hours)",
  };
  const questions = missing.map((f) => fieldLabels[f] ?? f).filter(Boolean);
  if (questions.length === 1) return questions[0];
  const last = questions.pop();
  return `${questions.join(", ")} and ${last}?`;
}

// ── Booking Help Handler ──────────────────────────────────────────────────────

async function handleBookingHelp(userId: string): Promise<AIChatResponse> {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      slot: { include: { location: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (bookings.length === 0) {
    return {
      success: true,
      intent: AIIntent.BOOKING_HELP,
      message:
        "You don't have any bookings yet. Would you like me to help you find a parking slot?",
    };
  }

  const active = bookings.filter((b) =>
    ["CONFIRMED", "ACTIVE"].includes(b.status)
  );
  const latest = bookings[0];
  const loc = latest.slot?.location;

  let message = `You have ${bookings.length} booking(s). `;
  if (active.length > 0) {
    const ab = active[0];
    const end = new Date(ab.endTime).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    message += `Your active booking is at **${ab.slot.location.name}**, slot **${ab.slot.slotNumber}** (Floor ${ab.slot.floor}), valid until **${end}**. `;
    message += `Total paid: ₹${ab.totalAmount.toFixed(2)}.`;
  } else {
    message += `Your most recent booking was at **${loc?.name}**, slot **${latest.slot.slotNumber}** — Status: **${latest.status}**.`;
  }

  return {
    success: true,
    intent: AIIntent.BOOKING_HELP,
    message,
    search: active.length > 0
      ? {
          location: active[0].slot.location.name,
          startTime: new Date(active[0].startTime).toISOString(),
          endTime: new Date(active[0].endTime).toISOString(),
        }
      : undefined,
  };
}

// ── Check Booking Handler ─────────────────────────────────────────────────────

async function handleCheckBooking(userId: string): Promise<AIChatResponse> {
  const now = new Date();
  const activeBooking = await prisma.booking.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "CONFIRMED"] },
      startTime: { lte: now },
      endTime: { gte: now },
    },
    include: { slot: { include: { location: true } }, payment: true },
    orderBy: { startTime: "desc" },
  });

  if (activeBooking) {
    const remaining = Math.max(
      0,
      Math.round(
        (activeBooking.endTime.getTime() - now.getTime()) / (1000 * 60)
      )
    );
    const hrs = Math.floor(remaining / 60);
    const mins = remaining % 60;
    const timeLeft =
      hrs > 0
        ? `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} min${mins !== 1 ? "s" : ""}`
        : `${mins} min${mins !== 1 ? "s" : ""}`;

    return {
      success: true,
      intent: AIIntent.CHECK_BOOKING,
      message: `You have an active booking at **${activeBooking.slot.location.name}**, slot **${activeBooking.slot.slotNumber}** (Floor ${activeBooking.slot.floor}). Time remaining: **${timeLeft}**. Vehicle: ${activeBooking.vehicleNumber}. Paid: ₹${activeBooking.totalAmount.toFixed(2)}.`,
      search: {
        location: activeBooking.slot.location.name,
        startTime: activeBooking.startTime.toISOString(),
        endTime: activeBooking.endTime.toISOString(),
      },
      extensionAction: {
        bookingId: activeBooking.id,
        extendHours: 1,
      },
    };
  }

  // Check for upcoming confirmed bookings
  const upcoming = await prisma.booking.findFirst({
    where: {
      userId,
      status: "CONFIRMED",
      startTime: { gte: now },
    },
    include: { slot: { include: { location: true } } },
    orderBy: { startTime: "asc" },
  });

  if (upcoming) {
    const startStr = upcoming.startTime.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return {
      success: true,
      intent: AIIntent.CHECK_BOOKING,
      message: `You have an upcoming booking at **${upcoming.slot.location.name}**, slot **${upcoming.slot.slotNumber}** on **${startStr}**. Reference: ${upcoming.bookingReference}.`,
    };
  }

  return {
    success: true,
    intent: AIIntent.CHECK_BOOKING,
    message:
      "You don't have any active or upcoming bookings right now. Would you like me to help you find parking?",
  };
}

// ── Extend Booking Handler ────────────────────────────────────────────────────

async function handleExtendBooking(
  userId: string,
  intent: ParsedParkingIntent
): Promise<AIChatResponse> {
  const now = new Date();
  const activeBooking = await prisma.booking.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "CONFIRMED"] },
      endTime: { gte: now },
    },
    include: { slot: { include: { location: true } } },
    orderBy: { startTime: "desc" },
  });

  if (!activeBooking) {
    return {
      success: true,
      intent: AIIntent.EXTEND_BOOKING,
      message:
        "I couldn't find an active booking to extend. Please check your bookings or create a new reservation.",
    };
  }

  const extraHours = intent.additionalDuration ?? 1;
  const newEnd = new Date(
    activeBooking.endTime.getTime() + extraHours * 60 * 60 * 1000
  );
  const additionalCost = calculateParkingFee(
    activeBooking.slot.location.hourlyRate,
    activeBooking.endTime,
    newEnd
  );

  return {
    success: true,
    intent: AIIntent.EXTEND_BOOKING,
    message: `I found your booking at **${activeBooking.slot.location.name}**, slot **${activeBooking.slot.slotNumber}**. I can extend it by **${extraHours} hour${extraHours !== 1 ? "s" : ""}** for an additional **${additionalCost.formattedTotal}**. Use the extend button below to confirm — this will check availability and process the extension securely.`,
    extensionAction: {
      bookingId: activeBooking.id,
      extendHours: extraHours,
    },
  };
}

// ── Cancel Booking Handler ────────────────────────────────────────────────────

async function handleCancelBooking(userId: string): Promise<AIChatResponse> {
  const activeBooking = await prisma.booking.findFirst({
    where: {
      userId,
      status: { in: ["CONFIRMED", "ACTIVE"] },
      endTime: { gte: new Date() },
    },
    include: { slot: { include: { location: true } } },
    orderBy: { startTime: "desc" },
  });

  if (!activeBooking) {
    return {
      success: true,
      intent: AIIntent.CANCEL_BOOKING,
      message:
        "You don't have an active booking to cancel. If you think this is an error, please check your bookings list.",
    };
  }

  return {
    success: true,
    intent: AIIntent.CANCEL_BOOKING,
    message: `Your booking at **${activeBooking.slot.location.name}** (slot ${activeBooking.slot.slotNumber}) — Ref: **${activeBooking.bookingReference}** — can be cancelled. A full demo refund of ₹${activeBooking.totalAmount.toFixed(2)} will be simulated. Please use the cancel button on your booking to confirm.`,
    bookingAction: {
      slotId: activeBooking.slotId,
      startTime: activeBooking.startTime.toISOString(),
      endTime: activeBooking.endTime.toISOString(),
      vehicleType: activeBooking.slot.vehicleType,
    },
  };
}

// ── General Help Handler ──────────────────────────────────────────────────────

function handleGeneralHelp(): AIChatResponse {
  return {
    success: true,
    intent: AIIntent.GENERAL_HELP,
    message: `Welcome to **Park Ease** — Mumbai's smart parking assistant! 🚗

Here's what I can help you with:
• 🔍 **Find parking** – Tell me where you're going, when, and what vehicle you're driving
• 📋 **Check bookings** – Ask "Show my bookings" or "What's my parking slot?"
• ⏱️ **Extend parking** – Say "I need 2 more hours" and I'll check availability
• ❌ **Cancel booking** – Ask "Cancel my booking" and I'll guide you
• 💳 **Payments** – We support UPI, Card, and Demo Wallet (simulated)
• ⚡ **EV Charging** – All 3 locations have EV charging bays

**Parking locations in Mumbai:**
- Phoenix Marketcity Mall - Kurla · ₹60/hr
- Jio World Centre - BKC · ₹100/hr
- Inorbit Mall & PVR Cinemas - Malad · ₹50/hr

What can I help you with today?`,
  };
}

// ── Search Parking Handler ────────────────────────────────────────────────────

async function handleSearchParking(
  intent: ParsedParkingIntent,
  existingPartial?: Partial<ParsedParkingIntent>
): Promise<AIChatResponse> {
  // Merge with any partial context
  const merged: ParsedParkingIntent = {
    ...existingPartial,
    ...intent,
    intent: AIIntent.SEARCH_PARKING,
  };

  // Check for required missing fields
  const missing = merged.missingFields ?? [];
  const requiredMissing = ["destination", "date", "startTime"].filter(
    (f) => missing.includes(f) || !merged[f as keyof ParsedParkingIntent]
  );

  // If critical fields are missing, ask a follow-up question
  if (requiredMissing.length > 0) {
    return {
      success: true,
      intent: AIIntent.SEARCH_PARKING,
      message: `Sure! I'd be happy to help you find parking. ${getMissingFieldsQuestion(requiredMissing)}`,
      requiresFollowUp: true,
      followUpQuestion: getMissingFieldsQuestion(requiredMissing),
      rawIntent: merged,
    };
  }

  // Match destination to database location
  const locationMatch = await matchLocation(merged.destination);

  if (!locationMatch.location) {
    const suggestions = locationMatch.suggestions.join(", ");
    return {
      success: true,
      intent: AIIntent.SEARCH_PARKING,
      message: `I couldn't confidently identify the parking location. Did you mean one of these?\n\n${locationMatch.suggestions.map((s) => `• ${s}`).join("\n")}\n\nPlease specify which location you'd like to park at.`,
      requiresFollowUp: true,
      followUpQuestion: `Which parking location did you mean? Options: ${suggestions}`,
      rawIntent: merged,
    };
  }

  const loc = locationMatch.location;

  // Build start/end Date objects
  const startDate = buildDateTime(merged.date!, merged.startTime!);
  let endDate: Date;

  if (merged.endTime && merged.endTime !== merged.startTime) {
    endDate = buildDateTime(merged.date!, merged.endTime);
    if (endDate <= startDate) endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // next day
  } else if (merged.durationHours) {
    endDate = computeEndFromDuration(startDate, merged.durationHours);
  } else {
    // Default: 2 hours if no duration given
    endDate = computeEndFromDuration(startDate, 2);
  }

  const durationHours = Math.round(((endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000)) * 100) / 100;

  // Get database-confirmed slot recommendations
  const recommendations = await getAIRecommendations({
    locationId: loc.id,
    locationName: loc.name,
    hourlyRate: loc.hourlyRate,
    startTime: startDate,
    endTime: endDate,
    vehicleType: merged.vehicleType,
    requiresEVCharging: merged.requiresEVCharging,
    floorPreference: merged.floorPreference,
    maxResults: 3,
  });

  const pricing = calculateParkingFee(loc.hourlyRate, startDate, endDate);
  const searchSummary = {
    locationId: loc.id,
    location: loc.name,
    date: merged.date,
    startTime: merged.startTime,
    endTime: endDate.toTimeString().slice(0, 5),
    durationHours,
    vehicleType: merged.vehicleType ?? "CAR",
    requiresEVCharging: merged.requiresEVCharging ?? false,
  };

  if (recommendations.length === 0) {
    return {
      success: true,
      intent: AIIntent.SEARCH_PARKING,
      message: `Sorry, all slots at **${loc.name}** are fully booked for ${merged.startTime} on ${merged.date}${merged.vehicleType ? ` for ${merged.vehicleType}` : ""}. Try a different time, date, or location.`,
      search: searchSummary,
      recommendations: [],
      parserUsed: merged.parserUsed,
    };
  }

  const slotWord = recommendations.length === 1 ? "slot" : "slots";
  return {
    success: true,
    intent: AIIntent.SEARCH_PARKING,
    message: `I found **${recommendations.length} available ${slotWord}** for you at **${loc.name}** on ${merged.date} at ${merged.startTime} for **${durationHours} hour${durationHours !== 1 ? "s" : ""}**. Estimated cost: **${pricing.formattedTotal}**. Tap "Reserve This Slot" to book instantly!`,
    search: searchSummary,
    recommendations,
    bookingAction:
      recommendations.length > 0
        ? {
            slotId: recommendations[0].slotId,
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            vehicleType: merged.vehicleType ?? "CAR",
          }
        : undefined,
    parserUsed: merged.parserUsed,
    rawIntent: merged,
  };
}

// ── Main Controller ───────────────────────────────────────────────────────────

export async function handleAIChat(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Unauthorized. Please log in to use the AI assistant.", 401);
    }

    const { message, context } = req.body as {
      message?: string;
      context?: {
        previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
        partialIntent?: Partial<ParsedParkingIntent>;
      };
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return sendError(res, "A non-empty 'message' string is required.", 400);
    }

    const userMessage = message.trim();
    const conversationHistory = context?.previousMessages ?? [];
    const partialIntent = context?.partialIntent ?? undefined;

    // ── Parse intent ────────────────────────────────────────────────────────
    const parsed = await parseIntent(userMessage, conversationHistory, partialIntent);
    const geminiUnavailable = (parsed as any).geminiUnavailable === true;

    // ── Route to the correct handler ─────────────────────────────────────────
    let response: AIChatResponse;

    switch (parsed.intent) {
      case AIIntent.CHECK_BOOKING:
        response = await handleCheckBooking(req.user.id);
        break;

      case AIIntent.BOOKING_HELP:
        response = await handleBookingHelp(req.user.id);
        break;

      case AIIntent.EXTEND_BOOKING:
        response = await handleExtendBooking(req.user.id, parsed);
        break;

      case AIIntent.CANCEL_BOOKING:
        response = await handleCancelBooking(req.user.id);
        break;

      case AIIntent.GENERAL_HELP:
        response = handleGeneralHelp();
        break;

      case AIIntent.SEARCH_PARKING:
      default:
        response = await handleSearchParking(parsed, partialIntent);
        break;
    }

    // Attach parser metadata
    response.parserUsed = parsed.parserUsed ?? "fallback";
    if (geminiUnavailable) {
      response.message +=
        "\n\n_ℹ️ Smart AI parsing is not configured — using intelligent local parser._";
    }

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("[AI Controller] Unexpected error:", error);
    return sendError(
      res,
      "The AI assistant encountered an unexpected error. Please try again or use the standard search.",
      500
    );
  }
}
