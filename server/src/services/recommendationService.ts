import { getAvailableSlots } from "./conflictService.js";
import { calculateParkingFee } from "./pricingService.js";
import { AIRecommendation } from "../types/index.js";

/**
 * Takes a fully resolved search intent and queries the existing Phase 2
 * conflictService.getAvailableSlots to get database-confirmed slot availability.
 *
 * Returns up to 3 ranked recommendations (ground floor preferred, then by slot number).
 * NEVER reports a slot as available unless the database confirms it.
 *
 * Does NOT duplicate any conflict detection logic — delegates entirely to conflictService.
 */
export async function getAIRecommendations(params: {
  locationId: string;
  locationName: string;
  hourlyRate: number;
  startTime: Date;
  endTime: Date;
  vehicleType?: string;
  requiresEVCharging?: boolean;
  floorPreference?: string;
  maxResults?: number;
}): Promise<AIRecommendation[]> {
  const {
    locationId,
    locationName,
    hourlyRate,
    startTime,
    endTime,
    vehicleType,
    requiresEVCharging,
    floorPreference,
    maxResults = 3,
  } = params;

  // For EV vehicle type, automatically require EV charging
  const needsEV = requiresEVCharging || vehicleType === "EV";

  // Delegate entirely to Phase 2 conflict service
  const { availableSlots } = await getAvailableSlots({
    locationId,
    startTime,
    endTime,
    vehicleType: vehicleType ?? undefined,
    isEVCharging: needsEV ? true : undefined,
    floor: floorPreference ?? undefined,
  });

  if (availableSlots.length === 0) return [];

  // Rank: Ground floor first, then by slot number ascending
  const ranked = [...availableSlots].sort((a, b) => {
    const floorA = a.floor === "G" ? 0 : parseInt(a.floor) || 99;
    const floorB = b.floor === "G" ? 0 : parseInt(b.floor) || 99;
    if (floorA !== floorB) return floorA - floorB;
    return a.slotNumber.localeCompare(b.slotNumber);
  });

  const topSlots = ranked.slice(0, maxResults);
  const pricing = calculateParkingFee(hourlyRate, startTime, endTime);

  return topSlots.map((slot) => ({
    slotId: slot.id,
    slotNumber: slot.slotNumber,
    floor: slot.floor,
    vehicleType: slot.vehicleType,
    isEVCharging: slot.isEVCharging,
    locationId,
    locationName,
    hourlyRate,
    estimatedTotal: pricing.totalAmount,
    formattedTotal: pricing.formattedTotal,
    durationHours: pricing.durationHours,
  }));
}
