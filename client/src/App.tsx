import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { LocationsPage } from './pages/LocationsPage';
import { LocationDetailPage } from './pages/LocationDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer';
import { BookingModal } from './components/booking/BookingModal';
import { DemoPaymentModal } from './components/booking/DemoPaymentModal';
import { TicketModal } from './components/booking/TicketModal';
import { ExtendModal } from './components/booking/ExtendModal';
import { api } from './services/api';
import { Location, ParkingSlot, Booking } from './types';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { user, isAdmin } = useAuth();

  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<any>({});

  // Modals & Drawers
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    location: Location | null;
    slot: ParkingSlot | null;
    startTime: string;
    endTime: string;
    durationHours: number;
    estimatedTotal: number;
  }>({
    isOpen: false,
    location: null,
    slot: null,
    startTime: '',
    endTime: '',
    durationHours: 2,
    estimatedTotal: 0,
  });

  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({
    isOpen: false,
    booking: null,
  });

  const [ticketModalState, setTicketModalState] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({
    isOpen: false,
    booking: null,
  });

  const [extendModalState, setExtendModalState] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({
    isOpen: false,
    booking: null,
  });

  const navigate = (page: string, params: any = {}) => {
    // Protected routes check
    if ((page === 'my-bookings' || page === 'admin') && !user) {
      setCurrentPage('login');
      setPageParams({ redirect: page });
      return;
    }
    if (page === 'admin' && !isAdmin) {
      alert('Access restricted to administrators.');
      return;
    }

    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Triggered when Home Search is submitted
  const handleHomeSearch = (searchParams: {
    locationId: string;
    date: string;
    startTime: string;
    durationHours: number;
    vehicleType: string;
    isEV: boolean;
  }) => {
    navigate('location-detail', {
      id: searchParams.locationId,
      date: searchParams.date,
      startTime: searchParams.startTime,
      durationHours: searchParams.durationHours,
      vehicleType: searchParams.vehicleType,
      isEV: searchParams.isEV,
    });
  };

  // Triggered when user selects a slot and clicks "Proceed to Reservation"
  const handleProceedBooking = (params: {
    location: Location;
    slot: ParkingSlot;
    startTime: string;
    endTime: string;
    durationHours: number;
    estimatedTotal: number;
  }) => {
    if (!user) {
      navigate('login');
      return;
    }

    setBookingModalState({
      isOpen: true,
      location: params.location,
      slot: params.slot,
      startTime: params.startTime,
      endTime: params.endTime,
      durationHours: params.durationHours,
      estimatedTotal: params.estimatedTotal,
    });
  };

  // Triggered when user enters vehicle license number and submits booking modal
  const handleProceedToPayment = async (vehicleNumber: string) => {
    if (!bookingModalState.slot) return;

    try {
      const res = await api.bookings.create({
        slotId: bookingModalState.slot.id,
        vehicleNumber,
        startTime: bookingModalState.startTime,
        endTime: bookingModalState.endTime,
      });

      // Close booking modal and open demo payment modal
      setBookingModalState((prev) => ({ ...prev, isOpen: false }));
      setPaymentModalState({
        isOpen: true,
        booking: res.booking,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create booking reservation.');
    }
  };

  // Triggered when demo payment succeeds
  const handlePaymentSuccess = (booking: Booking) => {
    setPaymentModalState({ isOpen: false, booking: null });
    setTicketModalState({ isOpen: true, booking });
  };

  // Triggered from AI Assistant [Reserve This Slot] button
  const handleAIReserveSlot = async (params: {
    slotId: string;
    locationId: string;
    startTime: string;
    endTime: string;
    vehicleType: string;
  }) => {
    if (!user) {
      navigate('login');
      return;
    }

    try {
      const [slot, loc] = await Promise.all([
        api.slots.getById(params.slotId),
        api.locations.getById(params.locationId),
      ]);

      const start = new Date(params.startTime);
      const end = new Date(params.endTime);
      const durationHours = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
      const estimatedTotal = loc.hourlyRate * durationHours;

      setBookingModalState({
        isOpen: true,
        location: loc,
        slot,
        startTime: params.startTime,
        endTime: params.endTime,
        durationHours,
        estimatedTotal,
      });
    } catch (err: any) {
      alert(err.message || 'Could not load slot details for booking.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Bar */}
      <Navbar
        onOpenAI={() => setIsAIOpen(true)}
        currentPage={currentPage}
        onNavigate={navigate}
      />

      {/* Main Screen Router */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onOpenAI={() => setIsAIOpen(true)}
            onNavigate={navigate}
            onSearch={handleHomeSearch}
          />
        )}

        {currentPage === 'locations' && (
          <LocationsPage onNavigate={navigate} />
        )}

        {currentPage === 'location-detail' && (
          <LocationDetailPage
            locationId={pageParams.id}
            initialParams={pageParams}
            onBack={() => navigate('locations')}
            onProceedBooking={handleProceedBooking}
          />
        )}

        {currentPage === 'my-bookings' && (
          <MyBookingsPage
            onOpenTicket={(b) => setTicketModalState({ isOpen: true, booking: b })}
            onOpenExtend={(b) => setExtendModalState({ isOpen: true, booking: b })}
            onNavigateHome={() => navigate('home')}
          />
        )}

        {currentPage === 'admin' && <AdminPage />}

        {currentPage === 'login' && (
          <LoginPage
            onNavigate={navigate}
            onLoginSuccess={() => navigate(pageParams.redirect || 'home')}
          />
        )}

        {currentPage === 'register' && (
          <RegisterPage
            onNavigate={navigate}
            onRegisterSuccess={() => navigate('home')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating "✨ Ask ParkEase AI" Button */}
      <button
        onClick={() => setIsAIOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-full text-sm font-extrabold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 shadow-xl shadow-brand-600/35 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
        <span>Ask ParkEase AI</span>
      </button>

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onSelectSlotToBook={handleAIReserveSlot}
        onNavigateToBookings={() => navigate('my-bookings')}
      />

      {/* Booking Details Modal */}
      {bookingModalState.isOpen && bookingModalState.location && bookingModalState.slot && (
        <BookingModal
          location={bookingModalState.location}
          slot={bookingModalState.slot}
          startTime={bookingModalState.startTime}
          endTime={bookingModalState.endTime}
          durationHours={bookingModalState.durationHours}
          estimatedTotal={bookingModalState.estimatedTotal}
          isOpen={bookingModalState.isOpen}
          onClose={() => setBookingModalState((prev) => ({ ...prev, isOpen: false }))}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {/* Demo Payment Modal */}
      {paymentModalState.isOpen && paymentModalState.booking && (
        <DemoPaymentModal
          booking={paymentModalState.booking}
          isOpen={paymentModalState.isOpen}
          onClose={() => setPaymentModalState({ isOpen: false, booking: null })}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Confirmed Ticket / Digital Pass Modal */}
      {ticketModalState.isOpen && ticketModalState.booking && (
        <TicketModal
          booking={ticketModalState.booking}
          isOpen={ticketModalState.isOpen}
          onClose={() => setTicketModalState({ isOpen: false, booking: null })}
          onOpenExtend={(b) => {
            setTicketModalState({ isOpen: false, booking: null });
            setExtendModalState({ isOpen: true, booking: b });
          }}
          onCancelBooking={async (id) => {
            if (window.confirm('Cancel this booking pass?')) {
              await api.bookings.cancel(id);
              setTicketModalState({ isOpen: false, booking: null });
              navigate('my-bookings');
            }
          }}
        />
      )}

      {/* Extend Parking Modal */}
      {extendModalState.isOpen && extendModalState.booking && (
        <ExtendModal
          booking={extendModalState.booking}
          isOpen={extendModalState.isOpen}
          onClose={() => setExtendModalState({ isOpen: false, booking: null })}
          onExtensionSuccess={(updated) => {
            setExtendModalState({ isOpen: false, booking: null });
            setTicketModalState({ isOpen: true, booking: updated });
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
