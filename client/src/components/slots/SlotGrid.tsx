import React, { useState } from 'react';
import { ParkingSlot } from '../../types';
import { Zap, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SlotGridProps {
  slots: ParkingSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: ParkingSlot) => void;
  floors?: string[];
  vehicleTypeFilter?: string;
  isEVFilter?: boolean;
}

export const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  selectedSlotId,
  onSelectSlot,
  floors = ['G', '1', '2'],
  vehicleTypeFilter,
  isEVFilter,
}) => {
  // Determine available floors from slots
  const allFloors = Array.from(new Set(slots.map((s) => s.floor))).sort();
  const activeFloorList = allFloors.length > 0 ? allFloors : floors;
  const [activeFloor, setActiveFloor] = useState<string>(activeFloorList[0] || 'G');

  // Filter slots for current floor
  const floorSlots = slots.filter((slot) => {
    if (slot.floor !== activeFloor) return false;
    if (vehicleTypeFilter && slot.vehicleType !== vehicleTypeFilter) return false;
    if (isEVFilter && !slot.isEVCharging) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6">
      {/* Header and Floor Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Interactive Parking Map
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an available spot on your preferred level to reserve.
          </p>
        </div>

        {/* Floor Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {activeFloorList.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFloor(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFloor === f
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Floor {f}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Status Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-4 px-2 text-xs font-medium text-slate-600 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-600"></span>
          <span>Occupied / Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-brand-600 ring-2 ring-brand-300"></span>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700">
          <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />
          <span>EV Charging</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border border-slate-300"></span>
          <span>Maintenance</span>
        </div>
      </div>

      {/* Grid Layout */}
      {floorSlots.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <ShieldAlert className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">No parking slots found on Floor {activeFloor}</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting another floor or adjusting filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {floorSlots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            const isAvailable = slot.status === 'AVAILABLE' && (slot.isCurrentlyAvailable !== false);
            const isMaintenance = slot.status === 'MAINTENANCE';

            let stateStyle = 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-900 cursor-pointer hover:shadow-md hover:-translate-y-0.5';
            if (isSelected) {
              stateStyle = 'bg-brand-600 border-brand-700 text-white shadow-md shadow-brand-600/30 scale-102 ring-2 ring-brand-300 cursor-pointer';
            } else if (isMaintenance) {
              stateStyle = 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75';
            } else if (!isAvailable) {
              stateStyle = 'bg-rose-50 border-rose-200 text-rose-900 cursor-not-allowed opacity-85';
            }

            return (
              <button
                key={slot.id}
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelectSlot(slot)}
                className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all text-left min-h-[96px] ${stateStyle}`}
              >
                {/* Top badges */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : slot.vehicleType === 'EV'
                      ? 'bg-emerald-100 text-emerald-800'
                      : slot.vehicleType === 'SUV'
                      ? 'bg-blue-100 text-blue-800'
                      : slot.vehicleType === 'BIKE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {slot.vehicleType}
                  </span>

                  {slot.isEVCharging && (
                    <span
                      title="EV Charging Bay"
                      className={`p-1 rounded-full ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    </span>
                  )}
                </div>

                {/* Slot Number */}
                <div className="my-1.5">
                  <span className="text-xl font-black tracking-tight block">
                    {slot.slotNumber}
                  </span>
                  <span className={`text-[10px] font-medium block -mt-0.5 ${
                    isSelected ? 'text-white/80' : 'text-slate-500'
                  }`}>
                    Floor {slot.floor}
                  </span>
                </div>

                {/* Status indicator line */}
                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-white font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  ) : isMaintenance ? (
                    <span className="flex items-center gap-1 text-slate-400">
                      <AlertTriangle className="w-3 h-3" /> Maintenance
                    </span>
                  ) : isAvailable ? (
                    <span className="text-emerald-700">Available</span>
                  ) : (
                    <span className="text-rose-700">Occupied</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
