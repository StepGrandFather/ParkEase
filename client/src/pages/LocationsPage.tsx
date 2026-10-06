import React, { useState, useEffect } from 'react';
import { Location } from '../types';
import { api } from '../services/api';
import { MapPin, Search, Zap, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

interface LocationsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const LocationsPage: React.FC<LocationsPageProps> = ({ onNavigate }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.locations.getAll();
        setLocations(data);
      } catch (err) {
        console.error('Error loading locations', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Mumbai Parking Locations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified commercial parking structures with live slot availability.
          </p>
        </div>

        {/* Search filter input */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mall, area, or city..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-2xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-xs sm:text-sm outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-semibold">Fetching Mumbai parking hubs...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 p-8">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No parking facilities match your search</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for Kurla, BKC, Malad, or Phoenix.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((loc) => (
            <div
              key={loc.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 block">
                      ₹{loc.hourlyRate}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block -mt-0.5">
                      per hour
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-5 leading-snug">
                  {loc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {loc.address}, {loc.city}
                </p>

                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
                    <span className="font-extrabold text-sm">{loc.totalSpots} Slots</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" /> Fast EV
                    </span>
                    <span className="font-extrabold text-sm">Charging Bay</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <button
                  onClick={() => onNavigate('location-detail', { id: loc.id })}
                  className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all hover:scale-102"
                >
                  <span>Select & View Slot Grid</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
