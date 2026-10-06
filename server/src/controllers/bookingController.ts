import { Request, Response } from "express";
import { prisma } from "../db.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { isSlotAvailable } from "../services/conflictService.js";
import { calculateParkingFee } from "../services/pricingService.js";
import { generateQrPayload } from "../services/qrService.js";
import { BookingStatus, PaymentMethod, PaymentStatus, UserRole } from "../types/index.js";

export async function createBooking(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Unauthorized. Please log in.", 401);
    }

    const { slotId, vehicleNumber, startTime, endTime, paymentMethod = PaymentMethod.CARD } = req.body;

    if (!slotId || !vehicleNumber || !startTime || !endTime) {
      return sendError(res, "slotId, vehicleNumber, startTime, and endTime are required.", 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return sendError(res, "Invalid date/time format. Provide valid ISO 8601 timestamps.", 400);
    }

    if (end <= start) {
      return sendError(res, "End time must be strictly after start time.", 400);
    }

    // Check slot existence and location
    const slot = await prisma.parkingSlot.findUnique({
      where: { id: slotId },
      include: { location: true },
    });

    if (!slot) {
      return sendError(res, "Parking slot not found.", 404);
    }

    if (slot.status === "MAINTENANCE") {
      return sendError(res, "This parking slot is currently under maintenance and cannot be booked.", 400);
    }

    // Calculate total price in INR
    const pricing = calculateParkingFee(slot.location.hourlyRate, start, end);

    // ATOMIC TRANSACTION: Check slot availability & create booking to prevent double-booking
    const newBooking = await prisma.$transaction(async (tx) => {
      // 1. Conflict Check within transaction lock
      const available = await isSlotAvailable(slotId, start, end, undefined, tx);
      if (!available) {
        throw new Error("CONFLICT_DETECTED: Parking slot is already booked for this requested time window.");
      }

      // 2. Generate Reference & Unique Identifiers
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingRef = `PE-MUM-${Date.now().toString().slice(-4)}-${randomSuffix}`;
      const tempId = `TEMP-${Date.now()}`;

      const qrPayload = generateQrPayload({
        bookingId: tempId,
        bookingRef,
        locationName: slot.location.name,
        slotNumber: slot.slotNumber,
        floor: slot.floor,
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        startTime: start,
        endTime: end,
      });

      // 3. Create Booking
      const booking = await tx.booking.create({
        data: {
          bookingReference: bookingRef,
          userId: req.user!.id,
          slotId: slot.id,
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          startTime: start,
          endTime: end,
          totalAmount: pricing.totalAmount,
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.SUCCESS,
          qrCodeData: qrPayload,
          payment: {
            create: {
              transactionId: `TXN-DEMO-${paymentMethod}-${Date.now()}-${randomSuffix}`,
              paymentMethod: paymentMethod,
              amount: pricing.totalAmount,
              status: PaymentStatus.SUCCESS,
            },
          },
        },
        include: {
          slot: {
            include: { location: true },
          },
          payment: true,
        },
      });

      // Update QR payload with actual persisted booking ID
      const finalizedQr = generateQrPayload({
        bookingId: booking.id,
        bookingRef: booking.bookingReference || bookingRef,
        locationName: slot.location.name,
        slotNumber: slot.slotNumber,
        floor: slot.floor,
        vehicleNumber: booking.vehicleNumber,
        startTime: start,
        endTime: end,
      });

      return await tx.booking.update({
        where: { id: booking.id },
        data: { qrCodeData: finalizedQr },
        include: {
          slot: {
            include: { location: true },
          },
          payment: true,
        },
      });
    });

    return sendSuccess(
      res,
      {
        booking: newBooking,
        pricing,
        isDemoPayment: true,
      },
      "Parking slot successfully booked and confirmed!",
      201
    );
  } catch (error: any) {
    if (error.message && error.message.includes("CONFLICT_DETECTED")) {
      return sendError(res, "Parking slot is already booked for this requested time window.", 409);
    }
    return sendError(res, `Failed to create booking: ${error.message}`, 500);
  }
}

export async function getUserBookings(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Unauthorized.", 401);
    }

    const { status } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.user.id,
        ...(status ? { status: String(status).toUpperCase() } : {}),
      },
      include: {
        slot: {
          include: { location: true },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, {
      count: bookings.length,
      bookings,
    });
  } catch (error: any) {
    return sendError(res, `Failed to retrieve bookings: ${error.message}`, 500);
  }
}

export async function getBookingById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Unauthorized.", 401);
    }

    const id = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        slot: {
          include: { location: true },
        },
        payment: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!booking) {
      return sendError(res, "Booking not found.", 404);
    }

    // Security check: Only the booking owner or an admin can access
    if (booking.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      return sendError(res, "Forbidden. You do not have permission to view this private booking.", 403);
    }

    return sendSuccess(res, booking);
  } catch (error: any) {
    return sendError(res, `Failed to retrieve booking: ${error.message}`, 500);
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Unauthorized.", 401);
    }

    const id = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!booking) {
      return sendError(res, "Booking not found.", 404);
    }

    // Security check: Only owner or admin can cancel
    if (booking.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      return sendError(res, "Forbidden. You cannot cancel someone else's booking.", 403);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return sendError(res, "This booking has already been cancelled.", 400);
    }

    if (booking.status === BookingStatus.COMPLETED) {
      return sendError(res, "Cannot cancel a completed booking.", 400);
    }

    // Perform cancellation and simulate refund
    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
        include: {
          slot: { include: { location: true } },
          payment: true,
        },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }

      return b;
    });

    return sendSuccess(
      res,
      {
        booking: updated,
        refundSimulated: true,
        refundAmount: `₹${booking.totalAmount.toFixed(2)}`,
      },
      "Booking cancelled successfully. Demo refund initiated."
    );
  } catch (error: any) {
    return sendError(res, `Failed to cancel booking: ${error.message}`, 500);
  }
}

export async function extendBooking(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Unauthorized.", 401);
    }

    const id = req.params.id as string;
    const { extendHours, newEndTime } = req.body;

    if (!extendHours && !newEndTime) {
      return sendError(res, "Either 'extendHours' (number) or 'newEndTime' (ISO string) is required.", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        slot: { include: { location: true } },
        payment: true,
      },
    });

    if (!booking) {
      return sendError(res, "Booking not found.", 404);
    }

    // Security check: Only owner or admin can extend
    if (booking.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      return sendError(res, "Forbidden. You cannot extend someone else's booking.", 403);
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      return sendError(res, `Cannot extend a ${booking.status.toLowerCase()} booking.`, 400);
    }

    let calculatedNewEnd: Date;
    if (extendHours) {
      if (typeof extendHours !== "number" || extendHours <= 0) {
        return sendError(res, "'extendHours' must be a positive number.", 400);
      }
      calculatedNewEnd = new Date(booking.endTime.getTime() + extendHours * 60 * 60 * 1000);
    } else {
      calculatedNewEnd = new Date(newEndTime);
      if (isNaN(calculatedNewEnd.getTime())) {
        return sendError(res, "Invalid 'newEndTime' ISO date format.", 400);
      }
    }

    if (calculatedNewEnd <= booking.endTime) {
      return sendError(res, "New end time must be after current end time.", 400);
    }

    const hourlyRate = booking.slot.location.hourlyRate;

    // Atomic extension conflict check
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Check availability between old end and new end
      const isAvailable = await isSlotAvailable(
        booking.slotId,
        booking.endTime,
        calculatedNewEnd,
        booking.id,
        tx
      );

      if (!isAvailable) {
        throw new Error("EXTENSION_CONFLICT: The slot is already reserved by another driver for the requested extension period.");
      }

      // Calculate additional price for extended duration
      const extensionPricing = calculateParkingFee(
        hourlyRate,
        booking.endTime,
        calculatedNewEnd
      );

      const newTotalAmount = Math.round((booking.totalAmount + extensionPricing.totalAmount) * 100) / 100;

      // Update QR payload with new end time
      const updatedQr = generateQrPayload({
        bookingId: booking.id,
        bookingRef: booking.bookingReference || `PE-${booking.id.slice(0, 8)}`,
        locationName: booking.slot.location.name,
        slotNumber: booking.slot.slotNumber,
        floor: booking.slot.floor,
        vehicleNumber: booking.vehicleNumber,
        startTime: booking.startTime,
        endTime: calculatedNewEnd,
      });

      const updated = await tx.booking.update({
        where: { id },
        data: {
          endTime: calculatedNewEnd,
          totalAmount: newTotalAmount,
          qrCodeData: updatedQr,
        },
        include: {
          slot: { include: { location: true } },
          payment: true,
        },
      });

      return {
        booking: updated,
        additionalCharge: extensionPricing,
      };
    });

    return sendSuccess(
      res,
      updatedBooking,
      "Parking duration successfully extended!"
    );
  } catch (error: any) {
    if (error.message && error.message.includes("EXTENSION_CONFLICT")) {
      return sendError(res, "Cannot extend parking: slot is already reserved by another driver for the extended duration.", 409);
    }
    return sendError(res, `Failed to extend booking: ${error.message}`, 500);
  }
}
