// Shared Domain Types and Enums for Park Ease

export const VehicleType = {
  CAR: "CAR",
  SUV: "SUV",
  BIKE: "BIKE",
  EV: "EV",
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];

export const SlotStatus = {
  AVAILABLE: "AVAILABLE",
  MAINTENANCE: "MAINTENANCE",
  OCCUPIED: "OCCUPIED",
} as const;
export type SlotStatus = (typeof SlotStatus)[keyof typeof SlotStatus];

export const BookingStatus = {
  HOLD: "HOLD",
  CONFIRMED: "CONFIRMED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CARD: "CARD",
  UPI: "UPI",
  DEMO_WALLET: "DEMO_WALLET",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: string;
}

export interface PriceCalculationResult {
  hourlyRate: number;
  durationHours: number;
  totalAmount: number;
  currency: "INR";
  currencySymbol: "₹";
  formattedTotal: string;
}

export interface QrCodePayload {
  bookingId: string;
  bookingRef: string;
  location: string;
  slot: string;
  floor: string;
  vehicle: string;
  start: string;
  end: string;
}

// ─── Phase 3: AI Assistant Types ────────────────────────────────────────────

export const AIIntent = {
  SEARCH_PARKING: "SEARCH_PARKING",
  BOOKING_HELP: "BOOKING_HELP",
  EXTEND_BOOKING: "EXTEND_BOOKING",
  CANCEL_BOOKING: "CANCEL_BOOKING",
  CHECK_BOOKING: "CHECK_BOOKING",
  GENERAL_HELP: "GENERAL_HELP",
} as const;
export type AIIntent = (typeof AIIntent)[keyof typeof AIIntent];

export interface ParsedParkingIntent {
  intent: AIIntent;
  destination?: string;
  date?: string;           // YYYY-MM-DD
  startTime?: string;      // HH:MM (24-hr)
  endTime?: string;        // HH:MM (24-hr)
  durationHours?: number;
  vehicleType?: string;    // CAR | SUV | BIKE | EV
  requiresEVCharging?: boolean;
  floorPreference?: string;
  additionalDuration?: number;
  userMessage?: string;
  missingFields?: string[];
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  parserUsed?: "gemini" | "fallback";
}

export interface AIRecommendation {
  slotId: string;
  slotNumber: string;
  floor: string;
  vehicleType: string;
  isEVCharging: boolean;
  locationId: string;
  locationName: string;
  hourlyRate: number;
  estimatedTotal: number;
  formattedTotal: string;
  durationHours: number;
}

export interface AIChatRequest {
  message: string;
  context?: {
    previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
    partialIntent?: Partial<ParsedParkingIntent>;
  };
}

export interface AIChatResponse {
  success: boolean;
  intent: AIIntent;
  message: string;
  search?: {
    locationId?: string;
    location?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    vehicleType?: string;
    requiresEVCharging?: boolean;
  };
  recommendations?: AIRecommendation[];
  bookingAction?: {
    slotId: string;
    startTime: string;
    endTime: string;
    vehicleType: string;
  };
  extensionAction?: {
    bookingId: string;
    extendHours: number;
  };
  requiresFollowUp?: boolean;
  followUpQuestion?: string;
  parserUsed?: "gemini" | "fallback";
  rawIntent?: ParsedParkingIntent;
}
