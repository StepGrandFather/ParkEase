import { Request, Response } from "express";
import { prisma } from "../db.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { BookingStatus, PaymentStatus, SlotStatus, VehicleType } from "../types/index.js";

export async function getAdminDashboard(req: Request, res: Response) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Locations & Slots
    const totalLocations = await prisma.location.count();
    const totalSlots = await prisma.parkingSlot.count();

    // 2. Currently Occupied Slots (active/confirmed overlapping right now)
    const activeOverlappingBookings = await prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.ACTIVE, BookingStatus.CONFIRMED] },
        startTime: { lte: now },
        endTime: { gte: now },
      },
      select: { slotId: true },
    });

    const occupiedSlotIds = new Set(activeOverlappingBookings.map((b) => b.slotId));
    const occupiedSlots = occupiedSlotIds.size;
    const maintenanceSlots = await prisma.parkingSlot.count({
      where: { status: SlotStatus.MAINTENANCE },
    });
    const availableSlots = Math.max(0, totalSlots - occupiedSlots - maintenanceSlots);

    // 3. Bookings Breakdown
    const todayBookings = await prisma.booking.count({
      where: {
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    const activeBookings = await prisma.booking.count({
      where: { status: BookingStatus.ACTIVE },
    });

    const confirmedBookings = await prisma.booking.count({
      where: { status: BookingStatus.CONFIRMED },
    });

    const completedBookings = await prisma.booking.count({
      where: { status: BookingStatus.COMPLETED },
    });

    const cancelledBookings = await prisma.booking.count({
      where: { status: BookingStatus.CANCELLED },
    });

    // 4. Revenue from successful payments
    const revenueAgg = await prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    });
    const totalRevenueINR = revenueAgg._sum.amount || 0;

    // 5. Total registered users
    const totalUsers = await prisma.user.count();

    return sendSuccess(res, {
      summary: {
        totalLocations,
        totalSlots,
        availableSlots,
        occupiedSlots,
        maintenanceSlots,
        occupancyRate: totalSlots > 0 ? `${Math.round((occupiedSlots / totalSlots) * 100)}%` : "0%",
      },
      bookings: {
        todayBookings,
        activeBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalAllTimeBookings: activeBookings + confirmedBookings + completedBookings + cancelledBookings,
      },
      revenue: {
        totalRevenueINR,
        formattedRevenue: `₹${totalRevenueINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        currency: "INR",
      },
      users: {
        totalUsers,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error: any) {
    return sendError(res, `Failed to fetch admin dashboard stats: ${error.message}`, 500);
  }
}

export async function getAdminBookings(req: Request, res: Response) {
  try {
    const { status, locationId, limit = 50, offset = 0 } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        ...(status ? { status: String(status).toUpperCase() } : {}),
        ...(locationId ? { slot: { locationId: String(locationId) } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        slot: { include: { location: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.booking.count();

    return sendSuccess(res, { total, count: bookings.length, bookings });
  } catch (error: any) {
    return sendError(res, `Failed to retrieve admin bookings: ${error.message}`, 500);
  }
}

export async function getAdminUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, { count: users.length, users });
  } catch (error: any) {
    return sendError(res, `Failed to retrieve users: ${error.message}`, 500);
  }
}

export async function createAdminLocation(req: Request, res: Response) {
  try {
    const { name, address, city, latitude, longitude, totalSpots, hourlyRate, imageUrl, description } = req.body;

    if (!name || !address || !city || hourlyRate === undefined) {
      return sendError(res, "name, address, city, and hourlyRate are required fields.", 400);
    }

    const location = await prisma.location.create({
      data: {
        name: String(name).trim(),
        address: String(address).trim(),
        city: String(city).trim(),
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        totalSpots: Number(totalSpots) || 0,
        hourlyRate: Number(hourlyRate),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        description: description ? String(description).trim() : null,
      },
    });

    return sendSuccess(res, location, "Parking location created successfully.", 201);
  } catch (error: any) {
    return sendError(res, `Failed to create location: ${error.message}`, 500);
  }
}

export async function updateAdminLocation(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { name, address, city, latitude, longitude, totalSpots, hourlyRate, imageUrl, description } = req.body;

    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, `Location '${id}' not found.`, 404);
    }

    const updated = await prisma.location.update({
      where: { id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(address ? { address: String(address).trim() } : {}),
        ...(city ? { city: String(city).trim() } : {}),
        ...(latitude !== undefined ? { latitude: Number(latitude) } : {}),
        ...(longitude !== undefined ? { longitude: Number(longitude) } : {}),
        ...(totalSpots !== undefined ? { totalSpots: Number(totalSpots) } : {}),
        ...(hourlyRate !== undefined ? { hourlyRate: Number(hourlyRate) } : {}),
        ...(imageUrl !== undefined ? { imageUrl: String(imageUrl).trim() } : {}),
        ...(description !== undefined ? { description: String(description).trim() } : {}),
      },
    });

    return sendSuccess(res, updated, "Location updated successfully.");
  } catch (error: any) {
    return sendError(res, `Failed to update location: ${error.message}`, 500);
  }
}

export async function createAdminSlot(req: Request, res: Response) {
  try {
    const { locationId, slotNumber, floor = "G", vehicleType = VehicleType.CAR, isEVCharging = false } = req.body;

    if (!locationId || !slotNumber) {
      return sendError(res, "locationId and slotNumber are required.", 400);
    }

    const locIdStr = String(locationId);
    const slotNumStr = String(slotNumber).trim().toUpperCase();

    const location = await prisma.location.findUnique({ where: { id: locIdStr } });
    if (!location) {
      return sendError(res, `Location '${locIdStr}' not found.`, 404);
    }

    // Check if slotNumber already exists in this location
    const existing = await prisma.parkingSlot.findUnique({
      where: {
        locationId_slotNumber: {
          locationId: locIdStr,
          slotNumber: slotNumStr,
        },
      },
    });

    if (existing) {
      return sendError(res, `Slot '${slotNumStr}' already exists at this location.`, 409);
    }

    const slot = await prisma.parkingSlot.create({
      data: {
        locationId: locIdStr,
        slotNumber: slotNumStr,
        floor: String(floor).trim().toUpperCase(),
        vehicleType: String(vehicleType).trim().toUpperCase(),
        isEVCharging: Boolean(isEVCharging),
        status: SlotStatus.AVAILABLE,
      },
      include: { location: true },
    });

    return sendSuccess(res, slot, "Parking slot created successfully.", 201);
  } catch (error: any) {
    return sendError(res, `Failed to create slot: ${error.message}`, 500);
  }
}

export async function updateAdminSlot(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { slotNumber, floor, vehicleType, isEVCharging, status } = req.body;

    const existing = await prisma.parkingSlot.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, `Slot '${id}' not found.`, 404);
    }

    const updated = await prisma.parkingSlot.update({
      where: { id },
      data: {
        ...(slotNumber ? { slotNumber: String(slotNumber).trim().toUpperCase() } : {}),
        ...(floor ? { floor: String(floor).trim().toUpperCase() } : {}),
        ...(vehicleType ? { vehicleType: String(vehicleType).trim().toUpperCase() } : {}),
        ...(isEVCharging !== undefined ? { isEVCharging: Boolean(isEVCharging) } : {}),
        ...(status ? { status: String(status).trim().toUpperCase() } : {}),
      },
      include: { location: true },
    });

    return sendSuccess(res, updated, "Parking slot updated successfully.");
  } catch (error: any) {
    return sendError(res, `Failed to update slot: ${error.message}`, 500);
  }
}
