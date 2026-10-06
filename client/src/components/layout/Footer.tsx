import React from 'react';
import { Car, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-900">
                Park<span className="text-brand-600">Ease</span>
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Smart parking reservation platform with real-time slot conflict resolution, multi-tier floor maps, and conversational AI assistance.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>College Mini-Project Demonstration</span>
            </div>
          </div>

          {/* Locations */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Mumbai Parking Hubs
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>Phoenix Marketcity Mall (Kurla)</li>
              <li>Jio World Centre (BKC)</li>
              <li>Inorbit Mall & PVR (Malad)</li>
            </ul>
          </div>

          {/* Supported Types */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Vehicle Categories
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>Standard Hatchbacks & Sedans (CAR)</li>
              <li>Full-size SUVs & Crossovers</li>
              <li>Two-Wheelers & Scooters (BIKE)</li>
              <li className="flex items-center gap-1 text-emerald-700 font-medium">
                <Zap className="w-3.5 h-3.5" />
                Dedicated EV Fast Charging Bays
              </li>
            </ul>
          </div>

          {/* Technology stack note */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Smart AI Features
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Powered by Google Gemini 2.0 Flash with deterministic local fallback for conversational slot discovery.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-600 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Natural Language Booking</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© 2026 Park Ease Platform. Built for College Project Demonstration.</p>
          <p className="mt-2 sm:mt-0 font-medium">INR (₹) Standard Billing · Demo Payments Gateway</p>
        </div>
      </div>
    </footer>
  );
};
