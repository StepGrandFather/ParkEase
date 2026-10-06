import { prisma } from "../db.js";
import { BookingStatus, SlotStatus } from "../types/index.js";
import { Prisma } from "@prisma/client";

/**
 * Checks if a specific slot is available during [startTime, endTime].
 * Optionally exclude a booking ID (useful during booking extensions).
 */
export async function isSlotAvailable(
  slotId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string,
  tx: Prisma.TransactionClient = prisma
): Promise<boolean> {
  // 1. Verify slot exists and is not under maintenance
  const slot = await tx.parkingSlot.findUnique({
    where: { id: slotId },
  });

  if (!slot || slot.status === SlotStatus.MAINTENANCE) {
    return false;
  }

  // 2. Query for overlapping active/confirmed/hold bookings
  // Overlap condition: existing.startTime < requested.endTime AND existing.endTime > requested.startTime
  const conflictingBookings = await tx.booking.findFirst({
    where: {
      slotId,
      status: {
        in: [BookingStatus.HOLD, BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
      },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });

  return !conflictingBookings;
}

/**
 * Returns all available slots for a given location within [startTime, endTime],
 * applying optional filters (vehicleType, isEVCharging, floor).
 */
export async function getAvailableSlots(params: {
  locationId: string;
  startTime: Date;
  endTime: Date;
  vehicleType?: string;
  isEVCharging?: boolean;
  floor?: string;
}) {
  const { locationId, startTime, endTime, vehicleType, isEVCharging, floor } = params;

  // 1. Find all active overlapping booking slot IDs for this location and time range
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      slot: { locationId },
      status: {
        in: [BookingStatus.HOLD, BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
      },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: {
      slotId: true,
    },
  });

  const bookedSlotIds = new Set(overlappingBookings.map((b) => b.slotId));

  // 2. Query all slots for this location matching filters
  const allSlots = await prisma.parkingSlot.findMany({
    where: {
      locationId,
      status: { not: SlotStatus.MAINTENANCE }, // Exclude maintenance slots
      ...(vehicleType ? { vehicleType } : {}),
      ...(isEVCharging !== undefined ? { isEVCharging } : {}),
      ...(floor ? { floor } : {}),
    },
    orderBy: [{ floor: "asc" }, { slotNumber: "asc" }],
  });

  // 3. Partition into available and booked
  const availableSlots = allSlots.filter((slot) => !bookedSlotIds.has(slot.id));
  const occupiedSlots = allSlots.filter((slot) => bookedSlotIds.has(slot.id));

  return {
    totalMatchingSlots: allSlots.length,
    availableCount: availableSlots.length,
    occupiedCount: occupiedSlots.length,
    availableSlots,
    occupiedSlots,
  };
}
