import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Car,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../services/api';
import { Location } from '../types';

interface HomePageProps {
  onOpenAI: () => void;
  onNavigate: (page: string, params?: any) => void;
  onSearch: (params: {
    locationId: string;
    date: string;
    startTime: string;
    durationHours: number;
    vehicleType: string;
    isEV: boolean;
  }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenAI,
  onNavigate,
  onSearch,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate);
  const [time, setTime] = useState<string>('18:00');
  const [duration, setDuration] = useState<number>(2);
  const [vehicleType, setVehicleType] = useState<string>('CAR');
  const [isEV, setIsEV] = useState<boolean>(false);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const data = await api.locations.getAll();
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocationId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load locations', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId) return;
    onSearch({
      locationId: selectedLocationId,
      date,
      startTime: time,
      durationHours: duration,
      vehicleType,
      isEV,
    });
  };

  return (
    <div className="space-y-16 pb-12">
      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-brand-50/60 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white border border-brand-200/80 text-brand-700 shadow-2xs mb-6 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-Time Parking Slot Booking · Mumbai Network</span>
          </div>

          {/* Main Hero Header */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight sm:leading-none">
            Park Before <span className="text-brand-600">You Arrive.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Reserve your guaranteed parking slot in advance and save time. Seamless entry with instant digital QR passes across Mumbai's prime commercial hubs.
          </p>

          {/* Prominent Search Card */}
          <div className="mt-10 max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-6 sm:p-8 text-left transition-all">
            <form onSubmit={handleSearchSubmit} className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Destination */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Destination Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-600">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <select
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-2xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} (₹{loc.hourlyRate}/hr)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm font-semibold text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 3. Arrival Time */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Arrival Time
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm font-semibold text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Duration, Vehicle Type Pills, and EV checkbox */}
              <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Vehicle Type Selection */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Vehicle Type
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['CAR', 'SUV', 'BIKE', 'EV'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setVehicleType(type);
                          if (type === 'EV') setIsEV(true);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          vehicleType === type
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}

                    <label className="ml-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEV}
                        onChange={(e) => setIsEV(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
                      <span>EV Charging Bay</span>
                    </label>
                  </div>
                </div>

                {/* Duration selector */}
                <div className="flex items-center gap-3">
                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Duration
                    </span>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="py-1.5 pl-3 pr-7 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value={1}>1 hour</option>
                      <option value={2}>2 hours</option>
                      <option value={3}>3 hours</option>
                      <option value={4}>4 hours</option>
                      <option value={5}>5 hours</option>
                    </select>
                  </div>

                  {/* Search Button */}
                  <div className="pt-5">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all hover:scale-102"
                    >
                      <span>Find Available Slots</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* AI Banner */}
          <div className="mt-8 max-w-4xl mx-auto bg-gradient-to-r from-brand-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-brand-600/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  Prefer to describe your booking?
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Say e.g. <em>"I need parking at Phoenix Marketcity tomorrow at 7 PM for my SUV"</em> — our AI finds and reserves it for you.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAI}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-brand-700 hover:bg-brand-50 shadow-md transition-all shrink-0 hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>✨ Ask ParkEase AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── MUMBAI LOCATIONS SHOWCASE ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Featured Parking Locations
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Guaranteed real-time availability across Mumbai's prime commercial destinations.
            </p>
          </div>
          <button
            onClick={() => onNavigate('locations')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>View All Facilities</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="p-2 rounded-xl bg-brand-50 text-brand-600">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800">
                    ₹{loc.hourlyRate}/hr
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-4 group-hover:text-brand-600 transition-colors">
                  {loc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {loc.address}, {loc.city}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>{loc.totalSpots} Total Capacity</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <Zap className="w-3.5 h-3.5 fill-current" /> EV Ready
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4">
                <button
                  onClick={() => onNavigate('location-detail', { id: loc.id })}
                  className="w-full py-2.5 rounded-xl border border-brand-200 text-xs font-bold text-brand-600 hover:bg-brand-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Slot Map & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            How Park Ease Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Three simple steps to secure your parking before reaching the gate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg mx-auto">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-900">Select Location & Level</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pick your Mumbai destination and view real-time multi-floor parking spot availability.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg mx-auto">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-900">Instant Demo Checkout</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lock in your spot with zero concurrency collision using simulated UPI or card demo payments.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg mx-auto">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-900">Scan QR Code & Park</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Display your verified digital parking pass at the boom-barrier for immediate contactless entry.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
