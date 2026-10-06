import { Request, Response } from "express";
import { prisma } from "../db.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { processDemoPayment } from "../services/paymentDemoService.js";
import { PaymentStatus } from "../types/index.js";

export async function createPayment(req: Request, res: Response) {
  try {
    const { bookingId, paymentMethod, simulateStatus = PaymentStatus.SUCCESS } = req.body;

    if (!bookingId || !paymentMethod) {
      return sendError(res, "'bookingId' and 'paymentMethod' (UPI, CARD, DEMO_WALLET) are required.", 400);
    }

    const result = await processDemoPayment({
      bookingId,
      paymentMethod,
      simulateStatus,
    });

    return sendSuccess(res, result, "Demo payment processed.", 201);
  } catch (error: any) {
    return sendError(res, `Payment failed: ${error.message}`, 400);
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            slot: { include: { location: true } },
          },
        },
      },
    });

    if (!payment) {
      return sendError(res, "Payment record not found.", 404);
    }

    return sendSuccess(
      res,
      {
        isDemo: true,
        payment,
        isVerified: payment.status === PaymentStatus.SUCCESS,
        verifiedAt: new Date().toISOString(),
      },
      "Payment verification retrieved."
    );
  } catch (error: any) {
    return sendError(res, `Failed to verify payment: ${error.message}`, 500);
  }
}
