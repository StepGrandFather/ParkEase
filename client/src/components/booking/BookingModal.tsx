import React, { useState } from 'react';
import { Location, ParkingSlot } from '../../types';
import { X, Clock, MapPin, ShieldCheck, Car, Zap, ArrowRight } from 'lucide-react';

interface BookingModalProps {
  location: Location;
  slot: ParkingSlot;
  startTime: string;
  endTime: string;
  durationHours: number;
  estimatedTotal: number;
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: (vehicleNumber: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  location,
  slot,
  startTime,
  endTime,
  durationHours,
  estimatedTotal,
  isOpen,
  onClose,
  onProceedToPayment,
}) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      setError('Please enter your vehicle license plate number.');
      return;
    }
    setError('');
    onProceedToPayment(vehicleNumber.trim().toUpperCase());
  };

  const formattedStart = new Date(startTime).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedEnd = new Date(endTime).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Confirm Parking Reservation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review details and enter your vehicle license plate.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reservation Summary Card */}
          <div className="bg-brand-50/60 rounded-2xl p-4 border border-brand-100/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider block">
                  Location
                </span>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  {location.name}
                </h4>
                <p className="text-xs text-slate-500">{location.address}, {location.city}</p>
              </div>

              {/* Slot pill */}
              <div className="bg-white px-3 py-1.5 rounded-xl border border-brand-200 text-center shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Slot</span>
                <span className="text-base font-black text-brand-700">{slot.slotNumber}</span>
                <span className="text-[10px] text-slate-500 font-medium block">Fl. {slot.floor}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-100 text-xs">
              <div>
                <span className="text-slate-400 block">Entry Window</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formattedStart}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Exit Window</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formattedEnd}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-brand-100 text-xs">
              <span className="text-slate-600 font-medium">
                Duration: <strong className="text-slate-900">{durationHours} hrs</strong> (@ ₹{location.hourlyRate}/hr)
              </span>
              {slot.isEVCharging && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <Zap className="w-3 h-3" /> EV Charging Ready
                </span>
              )}
            </div>
          </div>

          {/* Vehicle Plate Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Vehicle License Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Car className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. MH-02-EE-1984"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm font-semibold uppercase text-slate-800 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            <p className="text-[11px] text-slate-400 mt-1">
              Indian license plate required for automated parking boom-barrier entry.
            </p>
          </div>

          {/* Pricing summary */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-xs text-slate-500 block">Total Due</span>
              <span className="text-2xl font-black text-slate-900">
                ₹{estimatedTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Instant Confirmation</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-all hover:scale-[1.02]"
            >
              <span>Continue to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
