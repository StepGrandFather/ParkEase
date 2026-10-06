import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Booking } from '../../types';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Car,
  Zap,
  Printer,
  AlertCircle,
  Maximize2,
} from 'lucide-react';

interface TicketModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onOpenExtend?: (booking: Booking) => void;
  onCancelBooking?: (bookingId: string) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  booking,
  isOpen,
  onClose,
  onOpenExtend,
  onCancelBooking,
}) => {
  if (!isOpen) return null;

  const qrData =
    booking.qrCodeData ||
    JSON.stringify({
      bookingRef: booking.bookingReference,
      location: booking.slot?.location?.name,
      slot: booking.slot?.slotNumber,
      vehicle: booking.vehicleNumber,
      start: booking.startTime,
      end: booking.endTime,
    });

  const formattedStart = new Date(booking.startTime).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedEnd = new Date(booking.endTime).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isActive = booking.status === 'CONFIRMED' || booking.status === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header Ribbon */}
        <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">
              {booking.status === 'CANCELLED' ? 'Booking Cancelled' : 'Confirmed Parking Pass'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Body */}
        <div className="p-6">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <QRCodeSVG
                value={qrData}
                size={168}
                level="M"
                includeMargin={false}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3">
              Scan at Entrance Barrier
            </span>
            <span className="text-base font-black font-mono text-slate-800 tracking-wider mt-0.5">
              {booking.bookingReference || `PE-${booking.id.slice(0, 8)}`}
            </span>
          </div>

          {/* Ticket Metadata */}
          <div className="mt-6 space-y-4 text-xs">
            {/* Location & Slot */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Facility</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  {booking.slot?.location?.name}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  {booking.slot?.location?.address}, {booking.slot?.location?.city}
                </span>
              </div>
              <div className="bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200 text-center shrink-0">
                <span className="text-[9px] text-brand-600 font-bold uppercase block">Slot</span>
                <span className="text-lg font-black text-brand-700 leading-tight">
                  {booking.slot?.slotNumber}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Floor {booking.slot?.floor}
                </span>
              </div>
            </div>

            {/* Timings */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Entry</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {formattedStart}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Valid Until</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {formattedEnd}
                </span>
              </div>
            </div>

            {/* Vehicle & Fee */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Vehicle Plate</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5 uppercase tracking-wide">
                  {booking.vehicleNumber}
                </span>
                <span className="text-[10px] text-slate-500">
                  Type: {booking.slot?.vehicleType}
                  {booking.slot?.isEVCharging && ' · EV Charging'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Amount Paid</span>
                <span className="font-black text-slate-900 text-base block mt-0.5">
                  ₹{booking.totalAmount.toFixed(2)}
                </span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {booking.paymentStatus || 'PAID'} (DEMO)
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2">
            {isActive && onOpenExtend && (
              <button
                type="button"
                onClick={() => onOpenExtend(booking)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
              >
                + Extend Parking (+1h / +2h)
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>

              {isActive && onCancelBooking && (
                <button
                  type="button"
                  onClick={() => onCancelBooking(booking.id)}
                  className="w-1/2 py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
