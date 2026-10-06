import React, { useState, useEffect } from 'react';
import { Location, ParkingSlot, AvailabilityResult } from '../types';
import { api } from '../services/api';
import { SlotGrid } from '../components/slots/SlotGrid';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  Zap,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';

interface LocationDetailPageProps {
  locationId: string;
  initialParams?: {
    date?: string;
    startTime?: string;
    durationHours?: number;
    vehicleType?: string;
    isEV?: boolean;
    slotId?: string;
  };
  onBack: () => void;
  onProceedBooking: (params: {
    location: Location;
    slot: ParkingSlot;
    startTime: string;
    endTime: string;
    durationHours: number;
    estimatedTotal: number;
  }) => void;
}

export const LocationDetailPage: React.FC<LocationDetailPageProps> = ({
  locationId,
  initialParams,
  onBack,
  onProceedBooking,
}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Time & Vehicle Filter States
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = initialParams?.date || tomorrow.toISOString().slice(0, 10);

  const [date, setDate] = useState<string>(defaultDate);
  const [startTime, setStartTime] = useState<string>(initialParams?.startTime || '18:00');
  const [duration, setDuration] = useState<number>(initialParams?.durationHours || 2);
  const [vehicleType, setVehicleType] = useState<string>(initialParams?.vehicleType || 'CAR');
  const [isEV, setIsEV] = useState<boolean>(initialParams?.isEV || false);

  // Slots & Selection
  const [allSlots, setAllSlots] = useState<ParkingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [estimatedTotal, setEstimatedTotal] = useState<number>(0);

  // Load location details
  useEffect(() => {
    async function loadLocation() {
      try {
        const loc = await api.locations.getById(locationId);
        setLocation(loc);
      } catch (err) {
        console.error('Failed to load location', err);
      } finally {
        setLoading(false);
      }
    }
    loadLocation();
  }, [locationId]);

  // Query real-time availability from Phase 2 conflict engine
  useEffect(() => {
    async function checkSlots() {
      if (!locationId || !date || !startTime) return;
      setCheckingAvailability(true);

      try {
        const [sh, sm] = startTime.split(':').map(Number);
        const start = new Date(date);
        start.setHours(sh, sm, 0, 0);
        const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

        const res: AvailabilityResult = await api.locations.getAvailability({
          locationId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          vehicleType,
          isEVCharging: isEV ? true : undefined,
        });

        // Mark slots with availability flag
        const availableSet = new Set(res.availableSlots.map((s) => s.id));
        const combined = [...res.availableSlots, ...res.occupiedSlots].map((s) => ({
          ...s,
          isCurrentlyAvailable: availableSet.has(s.id),
        }));

        setAllSlots(combined);

        // Pre-select slot if passed from AI
        if (initialParams?.slotId) {
          const matching = combined.find((s) => s.id === initialParams.slotId);
          if (matching && matching.isCurrentlyAvailable) {
            setSelectedSlot(matching);
          }
        }

        // Calculate fee
        const rate = location?.hourlyRate || 60;
        setEstimatedTotal(rate * duration);
      } catch (err) {
        console.error('Failed checking slot availability', err);
      } finally {
        setCheckingAvailability(false);
      }
    }

    if (location) {
      checkSlots();
    }
  }, [location, date, startTime, duration, vehicleType, isEV]);

  if (loading || !location) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-sm font-semibold">Loading parking facility map...</span>
      </div>
    );
  }

  const handleSlotSelect = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
  };

  const handleProceed = () => {
    if (!selectedSlot) return;
    const [sh, sm] = startTime.split(':').map(Number);
    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

    onProceedBooking({
      location,
      slot: selectedSlot,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationHours: duration,
      estimatedTotal,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Locations</span>
        </button>
      </div>

      {/* Facility Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full w-fit border border-brand-200">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location.city}, Mumbai</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {location.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            {location.address} · Verified Multi-Level Garage with Automated Boom Barriers
          </p>
        </div>

        {/* Pricing badge */}
        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Rate</span>
            <span className="text-2xl font-black text-slate-900">₹{location.hourlyRate}</span>
            <span className="text-[10px] text-slate-500 font-medium block">per hour</span>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Capacity</span>
            <span className="text-2xl font-black text-slate-900">{location.totalSpots}</span>
            <span className="text-[10px] text-slate-500 font-medium block">Total Bays</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Timing & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>Filter Slot Availability</span>
            {checkingAvailability && (
              <span className="flex items-center gap-1 text-[11px] font-normal text-brand-600 lowercase">
                <Loader2 className="w-3 h-3 animate-spin" /> checking conflicts...
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Conflict resolution engine active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Date */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase">Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
            />
          </div>

          {/* Time */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase">Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
            >
              <option value={1}>1 Hour</option>
              <option value={2}>2 Hours</option>
              <option value={3}>3 Hours</option>
              <option value={4}>4 Hours</option>
              <option value={5}>5 Hours</option>
            </select>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase">Vehicle</label>
            <select
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value);
                if (e.target.value === 'EV') setIsEV(true);
              }}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
            >
              <option value="CAR">Car (Sedan/Hatchback)</option>
              <option value="SUV">SUV / Crossover</option>
              <option value="BIKE">Two-Wheeler (Bike)</option>
              <option value="EV">Electric Vehicle (EV)</option>
            </select>
          </div>

          {/* EV Toggle */}
          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer h-[38px]">
              <input
                type="checkbox"
                checked={isEV}
                onChange={(e) => setIsEV(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <Zap className="w-3.5 h-3.5 fill-emerald-600" />
              <span>EV Charger Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Visual Slot Grid Component */}
      <SlotGrid
        slots={allSlots}
        selectedSlotId={selectedSlot?.id || null}
        onSelectSlot={handleSlotSelect}
        vehicleTypeFilter={vehicleType}
        isEVFilter={isEV}
      />

      {/* Floating Selection Drawer / Sticky Bar */}
      {selectedSlot && (
        <div className="sticky bottom-6 z-30 max-w-4xl mx-auto bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center font-black text-lg text-white shrink-0">
              {selectedSlot.slotNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Floor {selectedSlot.floor} Selected</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold uppercase">
                  {selectedSlot.vehicleType}
                </span>
                {selectedSlot.isEVCharging && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" /> EV Bay
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {date} · {startTime} ({duration} hrs) · Total: <strong className="text-white text-sm">₹{estimatedTotal.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleProceed}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-lg hover:scale-102 shrink-0 cursor-pointer"
          >
            <span>Proceed to Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
