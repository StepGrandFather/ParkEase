import React, { useState, useEffect } from 'react';
import { AdminDashboardData, Booking, User, Location, ParkingSlot } from '../types';
import { api } from '../services/api';
import {
  Shield,
  TrendingUp,
  MapPin,
  Car,
  Ticket,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Wrench,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [locationSlots, setLocationSlots] = useState<ParkingSlot[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'users' | 'slots'>('overview');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, bList, uList, locs] = await Promise.all([
        api.admin.getDashboard(),
        api.admin.getBookings(),
        api.admin.getUsers(),
        api.locations.getAll(),
      ]);
      setDashboard(dash);
      setBookings(bList.bookings || []);
      setUsers(uList.users || []);
      setLocations(locs);
      if (locs.length > 0 && !selectedLocationId) {
        setSelectedLocationId(locs[0].id);
      }
    } catch (err) {
      console.error('Failed loading admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch slots when selected location changes
  useEffect(() => {
    async function loadSlots() {
      if (!selectedLocationId) return;
      try {
        const res = await api.locations.getSlots(selectedLocationId);
        setLocationSlots(res.slots || []);
      } catch (err) {
        console.error('Failed loading slots', err);
      }
    }
    loadSlots();
  }, [selectedLocationId]);

  const toggleSlotMaintenance = async (slot: ParkingSlot) => {
    const newStatus = slot.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await api.admin.updateSlotStatus(slot.id, newStatus);
      setActionSuccess(`Slot ${slot.slotNumber} updated to ${newStatus}`);
      const res = await api.locations.getSlots(selectedLocationId);
      setLocationSlots(res.slots || []);
      // Also refresh dashboard numbers
      const dash = await api.admin.getDashboard();
      setDashboard(dash);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update slot status');
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-sm font-semibold">Loading Admin Command Center...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            ParkEase Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-location monitoring, occupancy rates, and facility maintenance controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'overview' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'bookings' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'users' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'slots' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Slot Controls
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ── TAB 1: OVERVIEW ───────────────────────────────── */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-8">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Revenue
              </span>
              <div className="text-3xl font-black text-slate-900">
                {dashboard.revenue.formattedRevenue}
              </div>
              <p className="text-xs text-slate-500">Collected from confirmed bookings</p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Network Occupancy
              </span>
              <div className="text-3xl font-black text-brand-600">
                {dashboard.summary.occupancyRate}
              </div>
              <p className="text-xs text-slate-500">
                {dashboard.summary.occupiedSlots} of {dashboard.summary.totalSlots} slots occupied
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Bookings
              </span>
              <div className="text-3xl font-black text-emerald-600">
                {dashboard.bookings.activeBookings + dashboard.bookings.confirmedBookings}
              </div>
              <p className="text-xs text-slate-500">
                {dashboard.bookings.todayBookings} reservation(s) today
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Drivers
              </span>
              <div className="text-3xl font-black text-indigo-600">
                {dashboard.users.totalUsers}
              </div>
              <p className="text-xs text-slate-500">Registered Park Ease users</p>
            </div>
          </div>

          {/* Facilities Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Managed Parking Locations (Mumbai)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {locations.map((loc) => (
                <div key={loc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-sm">{loc.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{loc.city}</p>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Capacity: {loc.totalSpots} spots</span>
                    <span className="text-brand-600">₹{loc.hourlyRate}/hr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: BOOKINGS TABLE ─────────────────────────── */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">All Driver Reservations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time database records across all hubs.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Driver</th>
                  <th className="py-3.5 px-6">Location & Slot</th>
                  <th className="py-3.5 px-6">Plate & Type</th>
                  <th className="py-3.5 px-6">Timings</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-brand-600">
                      {b.bookingReference || `PE-${b.id.slice(0, 8)}`}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">{b.user?.name || 'Driver'}</span>
                      <span className="text-slate-400 text-[11px] block">{b.user?.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">{b.slot?.location?.name}</span>
                      <span className="text-brand-600 font-semibold text-[11px] block">
                        Slot {b.slot?.slotNumber} (Floor {b.slot?.floor})
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-slate-900 block">{b.vehicleNumber}</span>
                      <span className="text-slate-500 text-[11px] block">{b.slot?.vehicleType}</span>
                    </td>
                    <td className="py-4 px-6 text-[11px]">
                      <div>{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-slate-400">to {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      ₹{b.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'CONFIRMED' || b.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: USERS TABLE ────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Registered Users</h3>
            <p className="text-xs text-slate-500 mt-0.5">Platform members and administrator accounts.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Total Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{u.name}</td>
                    <td className="py-4 px-6">{u.email}</td>
                    <td className="py-4 px-6">{u.phone || '—'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold">{u._count?.bookings || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: SLOT MAINTENANCE CONTROLS ──────────────── */}
      {activeTab === 'slots' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-600" />
                Slot Maintenance Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle bays into Maintenance mode to temporarily take them offline from driver reservations.
              </p>
            </div>

            {/* Select Location */}
            <div className="w-full sm:w-72">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots grid with toggle button */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {locationSlots.map((slot) => {
              const isMaint = slot.status === 'MAINTENANCE';
              return (
                <div
                  key={slot.id}
                  className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 text-xs transition-all ${
                    isMaint
                      ? 'bg-slate-100 border-slate-300 text-slate-500'
                      : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">{slot.slotNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 font-bold">
                      Fl. {slot.floor}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500">
                    Type: <strong className="text-slate-700">{slot.vehicleType}</strong>
                  </div>

                  <button
                    onClick={() => toggleSlotMaintenance(slot)}
                    className={`mt-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
                      isMaint
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {isMaint ? 'Set Available' : 'Set Maintenance'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
