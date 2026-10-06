import { QrCodePayload } from "../types/index.js";

/**
 * Prepares privacy-conscious QR code payload for confirmed bookings.
 * Does not expose sensitive user personal information (e.g. passwords, billing details).
 */
export function generateQrPayload(params: {
  bookingId: string;
  bookingRef: string;
  locationName: string;
  slotNumber: string;
  floor: string;
  vehicleNumber: string;
  startTime: Date;
  endTime: Date;
}): string {
  const payload: QrCodePayload = {
    bookingId: params.bookingId,
    bookingRef: params.bookingRef,
    location: params.locationName,
    slot: params.slotNumber,
    floor: params.floor,
    vehicle: params.vehicleNumber,
    start: params.startTime.toISOString(),
    end: params.endTime.toISOString(),
  };

  return JSON.stringify(payload);
}
