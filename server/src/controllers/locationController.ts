import { Request, Response } from "express";
import { prisma } from "../db.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { getAvailableSlots } from "../services/conflictService.js";
import { calculateParkingFee } from "../services/pricingService.js";

export async function getAllLocations(req: Request, res: Response) {
  try {
    const locations = await prisma.location.findMany({
      include: {
        _count: {
          select: { slots: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      latitude: loc.latitude,
      longitude: loc.longitude,
      totalSpots: loc.totalSpots,
      hourlyRate: loc.hourlyRate,
      formattedRate: `₹${loc.hourlyRate.toFixed(2)}/hr`,
      imageUrl: loc.imageUrl,
      description: loc.description,
      slotCount: loc._count.slots,
    }));

    return sendSuccess(res, formatted);
  } catch (error: any) {
    return sendError(res, `Failed to retrieve locations: ${error.message}`, 500);
  }
}

export async function getLocationById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        slots: {
          orderBy: [{ floor: "asc" }, { slotNumber: "asc" }],
        },
      },
    });

    if (!location) {
      return sendError(res, `Location with ID '${id}' not found.`, 404);
    }

    const slots = location.slots || [];
    const evSlotCount = slots.filter((s) => s.isEVCharging).length;
    const floors = Array.from(new Set(slots.map((s) => s.floor))).sort();

    return sendSuccess(res, {
      ...location,
      formattedRate: `₹${location.hourlyRate.toFixed(2)}/hr`,
      evSlotCount,
      floors,
    });
  } catch (error: any) {
    return sendError(res, `Failed to retrieve location: ${error.message}`, 500);
  }
}

export async function getLocationAvailability(req: Request, res: Response) {
  try {
    const locationId = req.params.id as string;
    const { startTime, endTime, vehicleType, isEVCharging, floor } = req.query;

    if (!startTime || !endTime) {
      return sendError(res, "Both 'startTime' and 'endTime' ISO query parameters are required.", 400);
    }

    const start = new Date(startTime as string);
    const end = new Date(endTime as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return sendError(res, "Invalid date/time format. Provide valid ISO 8601 timestamps.", 400);
    }

    if (end <= start) {
      return sendError(res, "Requested 'endTime' must be strictly after 'startTime'.", 400);
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return sendError(res, `Location with ID '${locationId}' not found.`, 404);
    }

    // Run booking conflict detection
    const availability = await getAvailableSlots({
      locationId,
      startTime: start,
      endTime: end,
      vehicleType: vehicleType ? String(vehicleType).toUpperCase() : undefined,
      isEVCharging: isEVCharging !== undefined ? isEVCharging === "true" : undefined,
      floor: floor ? String(floor) : undefined,
    });

    // Estimate pricing for this slot duration
    const priceEstimate = calculateParkingFee(location.hourlyRate, start, end);

    return sendSuccess(res, {
      location: {
        id: location.id,
        name: location.name,
        hourlyRate: location.hourlyRate,
        formattedRate: `₹${location.hourlyRate.toFixed(2)}/hr`,
      },
      timeWindow: {
        start: start.toISOString(),
        end: end.toISOString(),
        durationHours: priceEstimate.durationHours,
        estimatedTotal: priceEstimate.formattedTotal,
      },
      summary: {
        totalFilteredSpots: availability.totalMatchingSlots,
        availableCount: availability.availableCount,
        occupiedCount: availability.occupiedCount,
      },
      availableSlots: availability.availableSlots,
      occupiedSlots: availability.occupiedSlots,
    });
  } catch (error: any) {
    return sendError(res, `Failed to check slot availability: ${error.message}`, 500);
  }
}
