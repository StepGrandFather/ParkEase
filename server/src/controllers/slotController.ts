import { Request, Response } from "express";
import { prisma } from "../db.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { isSlotAvailable } from "../services/conflictService.js";

export async function getSlotsByLocation(req: Request, res: Response) {
  try {
    const locationId = req.params.locationId as string;
    const { vehicleType, isEVCharging, floor, status } = req.query;

    const locationExists = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!locationExists) {
      return sendError(res, `Location with ID '${locationId}' not found.`, 404);
    }

    const slots = await prisma.parkingSlot.findMany({
      where: {
        locationId,
        ...(vehicleType ? { vehicleType: String(vehicleType).toUpperCase() } : {}),
        ...(isEVCharging !== undefined ? { isEVCharging: isEVCharging === "true" } : {}),
        ...(floor ? { floor: String(floor) } : {}),
        ...(status ? { status: String(status).toUpperCase() } : {}),
      },
      orderBy: [{ floor: "asc" }, { slotNumber: "asc" }],
    });

    return sendSuccess(res, {
      locationId,
      locationName: locationExists.name,
      count: slots.length,
      slots,
    });
  } catch (error: any) {
    return sendError(res, `Failed to retrieve slots: ${error.message}`, 500);
  }
}

export async function getSlotById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const slot = await prisma.parkingSlot.findUnique({
      where: { id },
      include: {
        location: true,
        bookings: {
          where: {
            status: { in: ["ACTIVE", "CONFIRMED"] },
            endTime: { gte: new Date() },
          },
          orderBy: { startTime: "asc" },
          take: 5,
        },
      },
    });

    if (!slot) {
      return sendError(res, `Parking slot with ID '${id}' not found.`, 404);
    }

    const currentlyAvailable = await isSlotAvailable(
      slot.id,
      new Date(),
      new Date(Date.now() + 60 * 60 * 1000)
    );

    return sendSuccess(res, {
      ...slot,
      isCurrentlyAvailable: currentlyAvailable,
    });
  } catch (error: any) {
    return sendError(res, `Failed to retrieve slot: ${error.message}`, 500);
  }
}
