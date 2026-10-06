import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Booking } from '../../types';

interface DemoPaymentModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (booking: Booking) => void;
}

export const DemoPaymentModal: React.FC<DemoPaymentModalProps> = ({
  booking,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'DEMO_WALLET'>('UPI');
  const [simulateStatus, setSimulateStatus] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      // Simulate realistic network delay for demo presentation
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const res = await api.payments.create({
        bookingId: booking.id,
        paymentMethod: method,
        simulateStatus,
      });

      if (simulateStatus === 'SUCCESS') {
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess(booking);
        }, 1000);
      } else {
        setError('Simulated payment was rejected by demo gateway. You can retry with SUCCESS.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Banner: College Demo Badge */}
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-1.5 shadow-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>College Mini-Project Demo Payment Gateway</span>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Amount Payable
            </span>
            <div className="text-3xl font-black text-slate-900 mt-0.5">
              ₹{booking.totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ref: <span className="font-mono font-semibold text-brand-600">{booking.bookingReference}</span> · Slot {booking.slot.slotNumber}
            </p>
          </div>

          {/* Payment Method Selector */}
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Demo Payment Method
            </label>

            {/* UPI Option */}
            <label
              onClick={() => setMethod('UPI')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                method === 'UPI'
                  ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-200'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Instant UPI</span>
                  <span className="text-xs text-slate-500 block">Google Pay, PhonePe, Paytm, BHIM</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={method === 'UPI'}
                onChange={() => setMethod('UPI')}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
            </label>

            {/* Card Option */}
            <label
              onClick={() => setMethod('CARD')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                method === 'CARD'
                  ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-200'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Credit / Debit Card</span>
                  <span className="text-xs text-slate-500 block">Visa, Mastercard, RuPay</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={method === 'CARD'}
                onChange={() => setMethod('CARD')}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
            </label>

            {/* Demo Wallet */}
            <label
              onClick={() => setMethod('DEMO_WALLET')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                method === 'DEMO_WALLET'
                  ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-200'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">ParkEase FastPass Wallet</span>
                  <span className="text-xs text-slate-500 block">1-Click Instant Demo Checkout</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={method === 'DEMO_WALLET'}
                onChange={() => setMethod('DEMO_WALLET')}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>

          {/* Examiner Simulation Toggle */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Examiner Test Toggle:
            </span>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <label className="flex items-center gap-1.5 cursor-pointer text-emerald-700">
                <input
                  type="radio"
                  name="simulateOutcome"
                  checked={simulateStatus === 'SUCCESS'}
                  onChange={() => setSimulateStatus('SUCCESS')}
                  className="text-emerald-600"
                />
                <span>Simulate Success</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-rose-700">
                <input
                  type="radio"
                  name="simulateOutcome"
                  checked={simulateStatus === 'FAILED'}
                  onChange={() => setSimulateStatus('FAILED')}
                  className="text-rose-600"
                />
                <span>Simulate Failure</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 animate-bounce" />
              <span className="font-bold">Payment Verified! Generating your digital ticket...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || success}
              onClick={handlePay}
              className="w-2/3 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Pay ₹{booking.totalAmount.toFixed(2)} Demo</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
