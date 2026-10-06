import React, { useState } from 'react';
import { Booking } from '../../types';
import { api } from '../../services/api';
import { X, Clock, AlertCircle, CheckCircle2, Loader2, PlusCircle } from 'lucide-react';

interface ExtendModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onExtensionSuccess: (updatedBooking: Booking) => void;
}

export const ExtendModal: React.FC<ExtendModalProps> = ({
  booking,
  isOpen,
  onClose,
  onExtensionSuccess,
}) => {
  const [extendHours, setExtendHours] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentEnd = new Date(booking.endTime);
  const newEnd = new Date(currentEnd.getTime() + extendHours * 60 * 60 * 1000);
  const hourlyRate = booking.slot?.location?.hourlyRate || 60;
  const additionalCost = hourlyRate * extendHours;

  const handleExtend = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.bookings.extend(booking.id, {
        extendHours,
      });
      setSuccess(true);
      setTimeout(() => {
        onExtensionSuccess(res.booking);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Cannot extend booking. Slot may be reserved by another driver.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
              <PlusCircle className="w-5 h-5 text-brand-600" />
              Extend Parking Duration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Slot {booking.slot?.slotNumber} · {booking.slot?.location?.name}
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
        <div className="p-6 space-y-5">
          {/* Extension duration pills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Additional Hours
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setExtendHours(h)}
                  className={`py-3 rounded-2xl border font-bold text-sm transition-all ${
                    extendHours === h
                      ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  +{h} Hour{h > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Cost Comparison */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-2.5">
            <div className="flex justify-between items-center text-slate-600">
              <span>Current Expiration:</span>
              <span className="font-semibold text-slate-800">
                {currentEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between items-center text-brand-700 font-bold">
              <span>New Expiration:</span>
              <span className="text-sm">
                {newEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-slate-900 font-bold">
              <span>Additional Charge:</span>
              <span className="text-base text-brand-600 font-black">
                +₹{additionalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">Slot extended successfully! Updating pass...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || success}
              onClick={handleExtend}
              className="w-2/3 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking slot...</span>
                </>
              ) : (
                <span>Confirm Extension (+₹{additionalCost})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
