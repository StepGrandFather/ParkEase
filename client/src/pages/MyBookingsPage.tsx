import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { api } from '../services/api';
import {
  Ticket,
  MapPin,
  Calendar,
  Clock,
  Car,
  Zap,
  QrCode,
  PlusCircle,
  XCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface MyBookingsPageProps {
  onOpenTicket: (booking: Booking) => void;
  onOpenExtend: (booking: Booking) => void;
  onNavigateHome: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  onOpenTicket,
  onOpenExtend,
  onNavigateHome,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.bookings.getMyBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? A simulated refund will be processed.')) {
      return;
    }

    try {
      const res = await api.bookings.cancel(bookingId);
      setActionMessage(`Booking cancelled successfully. Simulated refund: ${res.refundAmount}`);
      fetchBookings();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return b.status === 'ACTIVE' || b.status === 'CONFIRMED';
    if (statusFilter === 'COMPLETED') return b.status === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-8 h-8 text-brand-600" />
            My Parking Reservations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your active digital tickets, extend parking time, or access QR entry codes.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active / Confirmed' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-semibold">Retrieving your bookings...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">No bookings found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {statusFilter === 'ALL'
                ? "You haven't reserved any parking spots yet."
                : `No reservations found under '${statusFilter}'.`}
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-md shadow-brand-600/20"
          >
            <span>Find & Book Parking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b) => {
            const isActive = b.status === 'CONFIRMED' || b.status === 'ACTIVE';
            const isCancelled = b.status === 'CANCELLED';

            const startStr = new Date(b.startTime).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            const endStr = new Date(b.endTime).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            // Calculate remaining time if active
            const now = new Date();
            const end = new Date(b.endTime);
            const remainingMins = Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 60)));
            const hrs = Math.floor(remainingMins / 60);
            const mins = remainingMins % 60;

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {b.bookingReference || `PE-${b.id.slice(0, 8)}`}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  {/* Active time remaining pill */}
                  {isActive && remainingMins > 0 && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Remaining:
                      </span>
                      <span className="font-extrabold text-brand-700">
                        {hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`}
                      </span>
                    </div>
                  )}

                  {/* Location & Slot */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                      {b.slot?.location?.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {b.slot?.location?.address}, {b.slot?.location?.city}
                    </p>
                  </div>

                  {/* Slot Details Box */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Slot</span>
                      <span className="text-lg font-black text-slate-900 leading-tight">
                        {b.slot?.slotNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Floor {b.slot?.floor}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Vehicle</span>
                      <span className="font-mono font-bold text-slate-800 uppercase block">
                        {b.vehicleNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {b.slot?.vehicleType}
                        {b.slot?.isEVCharging && ' · EV'}
                      </span>
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Entry</span>
                      <span className="font-medium text-slate-800">{startStr}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Exit</span>
                      <span className="font-medium text-slate-800">{endStr}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Total Paid (Demo):</span>
                    <span className="font-black text-slate-900 text-sm">
                      ₹{b.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    onClick={() => onOpenTicket(b)}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Digital QR Pass</span>
                  </button>

                  {isActive && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenExtend(b)}
                        className="w-1/2 py-2 rounded-xl border border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Extend</span>
                      </button>

                      <button
                        onClick={() => handleCancel(b.id)}
                        className="w-1/2 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
