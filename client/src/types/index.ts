export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
  _count?: {
    bookings: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  hourlyRate: number;
  formattedRate?: string;
  imageUrl?: string | null;
  description?: string | null;
  slotCount?: number;
  evSlotCount?: number;
  floors?: string[];
  slots?: ParkingSlot[];
}

export interface ParkingSlot {
  id: string;
  locationId: string;
  slotNumber: string;
  floor: string;
  vehicleType: 'CAR' | 'SUV' | 'BIKE' | 'EV';
  isEVCharging: boolean;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'OCCUPIED';
  location?: Location;
  isCurrentlyAvailable?: boolean;
}

export interface Booking {
  id: string;
  bookingReference: string | null;
  userId: string;
  slotId: string;
  vehicleNumber: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'HOLD' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  qrCodeData: string | null;
  createdAt: string;
  updatedAt: string;
  slot: ParkingSlot & { location: Location };
  user?: User;
  payment?: Payment | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  transactionId: string;
  paymentMethod: 'UPI' | 'CARD' | 'DEMO_WALLET';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface AvailabilityResult {
  location: {
    id: string;
    name: string;
    hourlyRate: number;
    formattedRate: string;
  };
  timeWindow: {
    start: string;
    end: string;
    durationHours: number;
    estimatedTotal: string;
  };
  summary: {
    totalFilteredSpots: number;
    availableCount: number;
    occupiedCount: number;
  };
  availableSlots: ParkingSlot[];
  occupiedSlots: ParkingSlot[];
}

export interface AIRecommendation {
  slotId: string;
  slotNumber: string;
  floor: string;
  vehicleType: string;
  isEVCharging: boolean;
  locationId: string;
  locationName: string;
  hourlyRate: number;
  estimatedTotal: number;
  formattedTotal: string;
  durationHours: number;
}

export interface AIChatResponse {
  success: boolean;
  intent: string;
  message: string;
  search?: {
    locationId?: string;
    location?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    vehicleType?: string;
    requiresEVCharging?: boolean;
  };
  recommendations?: AIRecommendation[];
  bookingAction?: {
    slotId: string;
    startTime: string;
    endTime: string;
    vehicleType: string;
  };
  extensionAction?: {
    bookingId: string;
    extendHours: number;
  };
  requiresFollowUp?: boolean;
  followUpQuestion?: string;
  parserUsed?: 'gemini' | 'fallback';
}

export interface AdminDashboardData {
  summary: {
    totalLocations: number;
    totalSlots: number;
    availableSlots: number;
    occupiedSlots: number;
    maintenanceSlots: number;
    occupancyRate: string;
  };
  bookings: {
    todayBookings: number;
    activeBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalAllTimeBookings: number;
  };
  revenue: {
    totalRevenueINR: number;
    formattedRevenue: string;
    currency: string;
  };
  users: {
    totalUsers: number;
  };
  generatedAt: string;
}
