import { PriceCalculationResult } from "../types/index.js";

/**
 * Calculates parking fee based on hourly rate and duration in INR (₹).
 * Partial hours are calculated cleanly with a 1-hour minimum charge.
 * Rounded to 2 decimal places.
 */
export function calculateParkingFee(
  hourlyRate: number,
  startTime: Date,
  endTime: Date
): PriceCalculationResult {
  const diffMs = endTime.getTime() - startTime.getTime();
  if (diffMs <= 0) {
    throw new Error("End time must be strictly after start time.");
  }

  const diffHours = diffMs / (1000 * 60 * 60);
  // Minimum 1 hour, otherwise exact pro-rated hours rounded to 2 decimal places
  const billedHours = Math.max(1, Math.round(diffHours * 100) / 100);
  const totalAmount = Math.round(hourlyRate * billedHours * 100) / 100;

  return {
    hourlyRate,
    durationHours: billedHours,
    totalAmount,
    currency: "INR",
    currencySymbol: "₹",
    formattedTotal: `₹${totalAmount.toFixed(2)}`,
  };
}
