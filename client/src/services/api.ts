import {
  AuthResponse,
  User,
  Location,
  ParkingSlot,
  Booking,
  Payment,
  AvailabilityResult,
  AIChatResponse,
  AdminDashboardData,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

export function getToken(): string | null {
  return localStorage.getItem('parkease_token');
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem('parkease_token', token);
  } else {
    localStorage.removeItem('parkease_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // ── Auth ──────────────────────────────────────────
  auth: {
    async register(payload: { name: string; email: string; password: string; phone?: string }): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async login(payload: { email: string; password: string }): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async getMe(): Promise<User> {
      return request<User>('/auth/me');
    },
  },

  // ── Locations ─────────────────────────────────────
  locations: {
    async getAll(): Promise<Location[]> {
      return request<Location[]>('/locations');
    },

    async getById(id: string): Promise<Location> {
      return request<Location>(`/locations/${id}`);
    },

    async getAvailability(params: {
      locationId: string;
      startTime: string;
      endTime: string;
      vehicleType?: string;
      isEVCharging?: boolean;
      floor?: string;
    }): Promise<AvailabilityResult> {
      const query = new URLSearchParams({
        startTime: params.startTime,
        endTime: params.endTime,
      });
      if (params.vehicleType) query.append('vehicleType', params.vehicleType);
      if (params.isEVCharging !== undefined) query.append('isEVCharging', String(params.isEVCharging));
      if (params.floor) query.append('floor', params.floor);

      return request<AvailabilityResult>(`/locations/${params.locationId}/availability?${query.toString()}`);
    },

    async getSlots(locationId: string, filter?: { vehicleType?: string; isEVCharging?: boolean; floor?: string; status?: string }): Promise<{ slots: ParkingSlot[] }> {
      const query = new URLSearchParams();
      if (filter?.vehicleType) query.append('vehicleType', filter.vehicleType);
      if (filter?.isEVCharging !== undefined) query.append('isEVCharging', String(filter.isEVCharging));
      if (filter?.floor) query.append('floor', filter.floor);
      if (filter?.status) query.append('status', filter.status);

      return request<{ slots: ParkingSlot[] }>(`/locations/${locationId}/slots?${query.toString()}`);
    },
  },

  // ── Slots ─────────────────────────────────────────
  slots: {
    async getById(id: string): Promise<ParkingSlot> {
      return request<ParkingSlot>(`/slots/${id}`);
    },
  },

  // ── Bookings ──────────────────────────────────────
  bookings: {
    async create(payload: {
      slotId: string;
      vehicleNumber: string;
      startTime: string;
      endTime: string;
      paymentMethod?: 'UPI' | 'CARD' | 'DEMO_WALLET';
    }): Promise<{ booking: Booking; pricing: any; isDemoPayment: boolean }> {
      return request<{ booking: Booking; pricing: any; isDemoPayment: boolean }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async getMyBookings(status?: string): Promise<{ count: number; bookings: Booking[] }> {
      const query = status ? `?status=${status}` : '';
      return request<{ count: number; bookings: Booking[] }>(`/bookings${query}`);
    },

    async getById(id: string): Promise<Booking> {
      return request<Booking>(`/bookings/${id}`);
    },

    async cancel(id: string): Promise<{ booking: Booking; refundSimulated: boolean; refundAmount: string }> {
      return request<{ booking: Booking; refundSimulated: boolean; refundAmount: string }>(`/bookings/${id}/cancel`, {
        method: 'PATCH',
      });
    },

    async extend(id: string, payload: { extendHours?: number; newEndTime?: string }): Promise<{ booking: Booking; additionalCharge: any }> {
      return request<{ booking: Booking; additionalCharge: any }>(`/bookings/${id}/extend`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // ── Demo Payments ─────────────────────────────────
  payments: {
    async create(payload: {
      bookingId: string;
      paymentMethod: 'UPI' | 'CARD' | 'DEMO_WALLET';
      simulateStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
    }): Promise<{ isDemo: boolean; message: string; payment: Payment }> {
      return request<{ isDemo: boolean; message: string; payment: Payment }>('/payments/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async verify(id: string): Promise<{ isDemo: boolean; payment: Payment; isVerified: boolean }> {
      return request<{ isDemo: boolean; payment: Payment; isVerified: boolean }>(`/payments/${id}/verify`, {
        method: 'POST',
      });
    },
  },

  // ── AI Assistant ──────────────────────────────────
  ai: {
    async chat(payload: {
      message: string;
      context?: {
        previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
        partialIntent?: any;
      };
    }): Promise<AIChatResponse> {
      return request<AIChatResponse>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // ── Admin ─────────────────────────────────────────
  admin: {
    async getDashboard(): Promise<AdminDashboardData> {
      return request<AdminDashboardData>('/admin/dashboard');
    },

    async getBookings(params?: { status?: string; locationId?: string }): Promise<{ total: number; count: number; bookings: Booking[] }> {
      const query = new URLSearchParams();
      if (params?.status) query.append('status', params.status);
      if (params?.locationId) query.append('locationId', params.locationId);
      return request<{ total: number; count: number; bookings: Booking[] }>(`/admin/bookings?${query.toString()}`);
    },

    async getUsers(): Promise<{ count: number; users: User[] }> {
      return request<{ count: number; users: User[] }>('/admin/users');
    },

    async updateSlotStatus(id: string, status: 'AVAILABLE' | 'MAINTENANCE' | 'OCCUPIED'): Promise<ParkingSlot> {
      return request<ParkingSlot>(`/admin/slots/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },
};
