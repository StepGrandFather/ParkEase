import { prisma } from "../db.js";
import { BookingStatus, PaymentMethod, PaymentStatus } from "../types/index.js";

/**
 * =========================================================================
 * DEMO PAYMENT GATEWAY SIMULATION (FOR COLLEGE PROJECT & PROTOTYPE TESTING)
 * No real financial transactions are executed or processed.
 * =========================================================================
 */
export async function processDemoPayment(params: {
  bookingId: string;
  paymentMethod: string;
  simulateStatus?: string; // SUCCESS, FAILED, PENDING
}) {
  const { bookingId, paymentMethod, simulateStatus = PaymentStatus.SUCCESS } = params;

  // Validate payment method
  const validMethods = Object.values(PaymentMethod);
  if (!validMethods.includes(paymentMethod as any)) {
    throw new Error(`Invalid payment method '${paymentMethod}'. Supported: ${validMethods.join(", ")}`);
  }

  // Validate booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found for payment processing.");
  }

  const transactionId = `TXN-DEMO-${paymentMethod}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Process transaction in database
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create or update payment record
    const payment = await tx.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        transactionId,
        paymentMethod,
        amount: booking.totalAmount,
        status: simulateStatus,
      },
      update: {
        transactionId,
        paymentMethod,
        amount: booking.totalAmount,
        status: simulateStatus,
      },
    });

    // 2. If SUCCESS, confirm the booking and mark paymentStatus = PAID
    if (simulateStatus === PaymentStatus.SUCCESS) {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          paymentStatus: "PAID",
        },
      });
    } else if (simulateStatus === PaymentStatus.FAILED) {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "FAILED",
        },
      });
    }

    return payment;
  });

  return {
    isDemo: true,
    message: "DEMO PAYMENT SIMULATION PROCESSED SUCCESSFULLY",
    payment: result,
  };
}
