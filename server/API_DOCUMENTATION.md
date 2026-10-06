# Park Ease API Documentation (Phases 1, 2 & 3)

Complete REST API reference for **Park Ease** Smart Parking Reservation Platform.
- **Base URL**: `http://localhost:5000/api`
- **Default Currency**: Indian Rupee (`INR` / `₹`)
- **Authentication**: JWT Bearer token in the `Authorization` header (`Authorization: Bearer <token>`).

---

## Table of Contents
1. [Authentication APIs](#1-authentication-apis)
2. [Location APIs](#2-location-apis)
3. [Parking Slot APIs](#3-parking-slot-apis)
4. [Booking APIs](#4-booking-apis)
5. [Demo Payment APIs](#5-demo-payment-apis)
6. [Admin APIs](#6-admin-apis)
7. [AI Parking Assistant APIs](#7-ai-parking-assistant-apis)

---

## 1. Authentication APIs

### 1.1 Register User
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "name": "Rahul Sharma",
    "email": "rahul.sharma@example.com",
    "password": "password123",
    "phone": "+91 98192 34567"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful! Welcome to Park Ease.",
    "data": {
      "user": {
        "id": "e932b712-4f32-47d1-bf31-0dae8f521b01",
        "name": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "phone": "+91 98192 34567",
        "role": "USER",
        "createdAt": "2026-09-22T15:10:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
    }
  }
  ```
- **Possible Errors**:
  - `400 Bad Request`: Missing fields or invalid email format.
  - `409 Conflict`: Email already exists.

---

### 1.2 Login User
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "rahul.sharma@example.com",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": {
        "id": "e932b712-4f32-47d1-bf31-0dae8f521b01",
        "name": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "phone": "+91 98192 34567",
        "role": "USER"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
    }
  }
  ```
- **Possible Errors**:
  - `401 Unauthorized`: Invalid email or password.

---

### 1.3 Get Current User Profile
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Auth**: `Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User profile retrieved.",
    "data": {
      "id": "e932b712-4f32-47d1-bf31-0dae8f521b01",
      "name": "Rahul Sharma",
      "email": "rahul.sharma@example.com",
      "phone": "+91 98192 34567",
      "role": "USER",
      "createdAt": "2026-09-22T15:10:00.000Z",
      "_count": { "bookings": 2 }
    }
  }
  ```
- **Possible Errors**:
  - `401 Unauthorized`: Missing or expired token.

---

## 2. Location APIs

### 2.1 Get All Locations
- **Method**: `GET`
- **URL**: `/api/locations`
- **Auth**: None
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "loc-uuid-1",
        "name": "Phoenix Marketcity Mall - Kurla",
        "address": "LBS Marg, Kurla West",
        "city": "Mumbai",
        "latitude": 19.0864,
        "longitude": 72.8891,
        "totalSpots": 24,
        "hourlyRate": 60,
        "formattedRate": "₹60.00/hr",
        "slotCount": 24
      }
    ]
  }
  ```

---

### 2.2 Get Location by ID
- **Method**: `GET`
- **URL**: `/api/locations/:id`
- **Auth**: None
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "loc-uuid-1",
      "name": "Phoenix Marketcity Mall - Kurla",
      "hourlyRate": 60,
      "formattedRate": "₹60.00/hr",
      "evSlotCount": 4,
      "floors": ["1", "2", "G"],
      "slots": [...]
    }
  }
  ```
- **Possible Errors**:
  - `404 Not Found`: Location not found.

---

### 2.3 Check Real-Time Availability (Conflict Detection)
- **Method**: `GET`
- **URL**: `/api/locations/:id/availability`
- **Auth**: None
- **Query Parameters**:
  - `startTime` (string, required): ISO 8601 string (e.g., `2026-09-24T10:00:00Z`)
  - `endTime` (string, required): ISO 8601 string (e.g., `2026-09-24T13:00:00Z`)
  - `vehicleType` (string, optional): `CAR`, `SUV`, `BIKE`, `EV`
  - `isEVCharging` (boolean, optional): `true` / `false`
  - `floor` (string, optional): `G`, `1`, `2`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "location": {
        "id": "loc-uuid-1",
        "name": "Phoenix Marketcity Mall - Kurla",
        "hourlyRate": 60,
        "formattedRate": "₹60.00/hr"
      },
      "timeWindow": {
        "start": "2026-09-24T10:00:00.000Z",
        "end": "2026-09-24T13:00:00.000Z",
        "durationHours": 3,
        "estimatedTotal": "₹180.00"
      },
      "summary": {
        "totalFilteredSpots": 10,
        "availableCount": 8,
        "occupiedCount": 2
      },
      "availableSlots": [
        {
          "id": "slot-uuid-101",
          "slotNumber": "1-01",
          "floor": "1",
          "vehicleType": "CAR",
          "isEVCharging": false,
          "status": "AVAILABLE"
        }
      ],
      "occupiedSlots": [...]
    }
  }
  ```
- **Possible Errors**:
  - `400 Bad Request`: Missing parameters, invalid date, or `endTime <= startTime`.
  - `404 Not Found`: Location not found.

---

## 3. Parking Slot APIs

### 3.1 Get Slots for Location
- **Method**: `GET`
- **URL**: `/api/locations/:locationId/slots`
- **Auth**: None
- **Query Parameters**: `vehicleType`, `isEVCharging`, `floor`, `status`
- **Response (200 OK)**: List of slots filtered by floor, vehicle type, or EV status.

### 3.2 Get Slot Details
- **Method**: `GET`
- **URL**: `/api/slots/:id`
- **Auth**: None
- **Response (200 OK)**: Slot details with location, upcoming bookings, and `isCurrentlyAvailable` indicator.

---

## 4. Booking APIs

### 4.1 Create Booking (Double-Booking Protected)
- **Method**: `POST`
- **URL**: `/api/bookings`
- **Auth**: `Bearer <token>`
- **Request Body**:
  ```json
  {
    "slotId": "slot-uuid-101",
    "vehicleNumber": "MH-02-EE-1984",
    "startTime": "2026-09-24T10:00:00.000Z",
    "endTime": "2026-09-24T13:00:00.000Z",
    "paymentMethod": "UPI"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Parking slot successfully booked and confirmed!",
    "data": {
      "booking": {
        "id": "book-uuid-99",
        "bookingReference": "PE-MUM-2026-8812",
        "vehicleNumber": "MH-02-EE-1984",
        "startTime": "2026-09-24T10:00:00.000Z",
        "endTime": "2026-09-24T13:00:00.000Z",
        "totalAmount": 180,
        "status": "CONFIRMED",
        "paymentStatus": "PAID",
        "qrCodeData": "{\"bookingId\":\"book-uuid-99\",\"bookingRef\":\"PE-MUM-2026-8812\",...}",
        "slot": {
          "slotNumber": "1-01",
          "floor": "1",
          "location": { "name": "Phoenix Marketcity Mall - Kurla" }
        },
        "payment": {
          "transactionId": "TXN-DEMO-UPI-17270220-4321",
          "paymentMethod": "UPI",
          "amount": 180,
          "status": "SUCCESS"
        }
      },
      "pricing": {
        "hourlyRate": 60,
        "durationHours": 3,
        "totalAmount": 180,
        "currency": "INR",
        "currencySymbol": "₹",
        "formattedTotal": "₹180.00"
      },
      "isDemoPayment": true
    }
  }
  ```
- **Possible Errors**:
  - `409 Conflict`: Slot already booked by another user for that window.
  - `400 Bad Request`: Slot is in MAINTENANCE or invalid dates.
  - `401 Unauthorized`: Not logged in.

---

### 4.2 Get User Bookings
- **Method**: `GET`
- **URL**: `/api/bookings`
- **Auth**: `Bearer <token>`
- **Query Parameters**: `status` (`CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`)
- **Response (200 OK)**: Returns all personal bookings of the logged-in user.

---

### 4.3 Get Booking by ID
- **Method**: `GET`
- **URL**: `/api/bookings/:id`
- **Auth**: `Bearer <token>`
- **Response (200 OK)**: Complete booking details, location, QR data payload, and payment receipt.
- **Security**: Only the booking owner or an admin can access (returns `403 Forbidden` if unauthorized).

---

### 4.4 Extend Booking Duration
- **Method**: `POST`
- **URL**: `/api/bookings/:id/extend`
- **Auth**: `Bearer <token>`
- **Request Body**:
  ```json
  {
    "extendHours": 1
  }
  ```
  *(or specify `"newEndTime": "2026-09-24T14:00:00.000Z"`)*
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Parking duration successfully extended!",
    "data": {
      "booking": {
        "id": "book-uuid-99",
        "endTime": "2026-09-24T14:00:00.000Z",
        "totalAmount": 240,
        "qrCodeData": "..."
      },
      "additionalCharge": {
        "durationHours": 1,
        "totalAmount": 60,
        "formattedTotal": "₹60.00"
      }
    }
  }
  ```
- **Possible Errors**:
  - `409 Conflict`: Slot is already reserved by another driver for the extension period.
  - `403 Forbidden`: Not booking owner.

---

### 4.5 Cancel Booking
- **Method**: `PATCH`
- **URL**: `/api/bookings/:id/cancel`
- **Auth**: `Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Booking cancelled successfully. Demo refund initiated.",
    "data": {
      "booking": {
        "id": "book-uuid-99",
        "status": "CANCELLED",
        "paymentStatus": "REFUNDED"
      },
      "refundSimulated": true,
      "refundAmount": "₹180.00"
    }
  }
  ```

---

## 5. Demo Payment APIs

### 5.1 Create Demo Payment
- **Method**: `POST`
- **URL**: `/api/payments/create`
- **Auth**: `Bearer <token>`
- **Request Body**:
  ```json
  {
    "bookingId": "book-uuid-99",
    "paymentMethod": "UPI",
    "simulateStatus": "SUCCESS"
  }
  ```
- **Supported Methods**: `UPI`, `CARD`, `DEMO_WALLET`
- **Simulate States**: `SUCCESS`, `FAILED`, `PENDING`
- **Response (201 Created)**: Returns demo transaction receipt with simulated transaction ID (`TXN-DEMO-UPI-...`).

### 5.2 Verify Demo Payment
- **Method**: `POST`
- **URL**: `/api/payments/:id/verify`
- **Auth**: `Bearer <token>`
- **Response (200 OK)**: Confirms transaction state and booking sync.

---

## 6. Admin APIs (Requires ADMIN Role)

### 6.1 Admin Dashboard
- **Method**: `GET`
- **URL**: `/api/admin/dashboard`
- **Auth**: `Bearer <admin_token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "totalLocations": 3,
        "totalSlots": 58,
        "availableSlots": 57,
        "occupiedSlots": 1,
        "maintenanceSlots": 0,
        "occupancyRate": "2%"
      },
      "bookings": {
        "todayBookings": 1,
        "activeBookings": 1,
        "confirmedBookings": 2,
        "completedBookings": 1,
        "cancelledBookings": 0,
        "totalAllTimeBookings": 4
      },
      "revenue": {
        "totalRevenueINR": 710,
        "formattedRevenue": "₹710.00",
        "currency": "INR"
      },
      "users": {
        "totalUsers": 4
      }
    }
  }
  ```

### 6.2 Admin Bookings Overview
- **Method**: `GET`
- **URL**: `/api/admin/bookings`
- **Auth**: `Bearer <admin_token>`
- **Query Parameters**: `status`, `locationId`, `limit`, `offset`
- **Response (200 OK)**: List of all bookings across all drivers.

### 6.3 Admin Users List
- **Method**: `GET`
- **URL**: `/api/admin/users`
- **Auth**: `Bearer <admin_token>`
- **Response (200 OK)**: List of all registered users with booking count.

### 6.4 Create / Update Parking Location
- **POST** `/api/admin/locations`
- **PATCH** `/api/admin/locations/:id`

### 6.5 Create / Update Parking Slot
- **POST** `/api/admin/slots`
- **PATCH** `/api/admin/slots/:id` (e.g. toggle maintenance mode: `{ "status": "MAINTENANCE" }`)

---

## 7. AI Parking Assistant APIs

### 7.1 Conversational Parking Assistant
- **Method**: `POST`
- **URL**: `/api/ai/chat`
- **Auth**: `Bearer <token>` (Authentication required)
- **Content-Type**: `application/json`

#### Description:
Accepts natural language user input, parses the intent into structured parking requirements (via Google Gemini Flash or deterministic regex fallback), validates destination against real database locations, invokes Phase 2 conflict detection to check real availability, and returns up to 3 database-confirmed slot recommendations.

#### Supported Intents:
- `SEARCH_PARKING`: Find and recommend available slots.
- `BOOKING_HELP`: Overview of user's past and active bookings.
- `EXTEND_BOOKING`: Checks user's active booking and calculates extra duration/pricing.
- `CANCEL_BOOKING`: Guides user on cancelling their reservation.
- `CHECK_BOOKING`: Real-time status, remaining time, and slot number for active bookings.
- `GENERAL_HELP`: Explains Park Ease functionality, payment methods, EV bays, and pricing.

#### Request Body Schema:
```json
{
  "message": "I need parking at Phoenix Marketcity tomorrow at 7 PM for 2 hours with my SUV",
  "context": {
    "previousMessages": [
      { "role": "user", "content": "I need parking tomorrow" },
      { "role": "assistant", "content": "Sure! Which location and vehicle type?" }
    ],
    "partialIntent": {
      "date": "2026-09-23"
    }
  }
}
```

#### Example 1: Successful Slot Recommendation (`SEARCH_PARKING`)
- **Request**:
  ```json
  {
    "message": "I am going to Jio World Centre tomorrow at 6 PM with my SUV for 3 hours"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "intent": "SEARCH_PARKING",
    "message": "I found 3 available slots for you at Jio World Centre - BKC on 2026-09-23 at 18:00 for 3 hours. Estimated cost: ₹300.00. Tap \"Reserve This Slot\" to book instantly!",
    "search": {
      "locationId": "loc-uuid-jio",
      "location": "Jio World Centre - BKC, Mumbai",
      "date": "2026-09-23",
      "startTime": "18:00",
      "endTime": "21:00",
      "durationHours": 3,
      "vehicleType": "SUV",
      "requiresEVCharging": false
    },
    "recommendations": [
      {
        "slotId": "slot-uuid-g07",
        "slotNumber": "G-07",
        "floor": "G",
        "vehicleType": "SUV",
        "isEVCharging": false,
        "locationId": "loc-uuid-jio",
        "locationName": "Jio World Centre - BKC",
        "hourlyRate": 100,
        "estimatedTotal": 300,
        "formattedTotal": "₹300.00",
        "durationHours": 3
      }
    ],
    "bookingAction": {
      "slotId": "slot-uuid-g07",
      "startTime": "2026-09-23T18:00:00.000Z",
      "endTime": "2026-09-23T21:00:00.000Z",
      "vehicleType": "SUV"
    },
    "parserUsed": "gemini"
  }
  ```

#### Example 2: Conversational Follow-Up for Missing Information
- **Request**:
  ```json
  {
    "message": "I need parking tomorrow"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "intent": "SEARCH_PARKING",
    "message": "Sure! I'd be happy to help you find parking. Which parking location are you going to? (e.g. Phoenix Marketcity, Jio World Centre, or Inorbit Mall) and What time will you arrive? (e.g. 7 PM, 6:30 PM)?",
    "requiresFollowUp": true,
    "followUpQuestion": "Which parking location are you going to? (e.g. Phoenix Marketcity, Jio World Centre, or Inorbit Mall) and What time will you arrive? (e.g. 7 PM, 6:30 PM)?",
    "rawIntent": {
      "intent": "SEARCH_PARKING",
      "date": "2026-09-23",
      "missingFields": ["destination", "startTime", "vehicleType", "durationHours"]
    }
  }
  ```

#### Example 3: Unrecognized Location Clarification (Never Invents Locations)
- **Request**:
  ```json
  {
    "message": "I need parking near Hogwarts Castle tomorrow at 7 PM for 2 hours"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "intent": "SEARCH_PARKING",
    "message": "I couldn't confidently identify the parking location. Did you mean one of these?\n\n• Phoenix Marketcity Mall - Kurla, Mumbai\n• Jio World Centre - BKC, Mumbai\n• Inorbit Mall & PVR Cinemas - Malad, Mumbai\n\nPlease specify which location you'd like to park at.",
    "requiresFollowUp": true,
    "followUpQuestion": "Which parking location did you mean? Options: Phoenix Marketcity Mall - Kurla, Mumbai, Jio World Centre - BKC, Mumbai, Inorbit Mall & PVR Cinemas - Malad, Mumbai"
  }
  ```

#### Example 4: Extension Assistant (`EXTEND_BOOKING`)
- **Request**:
  ```json
  {
    "message": "Can I extend my parking for another 2 hours?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "intent": "EXTEND_BOOKING",
    "message": "I found your booking at Phoenix Marketcity Mall - Kurla, slot G-01. I can extend it by 2 hours for an additional ₹120.00. Use the extend button below to confirm — this will check availability and process the extension securely.",
    "extensionAction": {
      "bookingId": "booking-uuid-1",
      "extendHours": 2
    }
  }
  ```

#### Example 5: Active Booking Status (`CHECK_BOOKING`)
- **Request**:
  ```json
  {
    "message": "What is my parking slot and time remaining?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "intent": "CHECK_BOOKING",
    "message": "You have an active booking at Phoenix Marketcity Mall - Kurla, slot G-01 (Floor G). Time remaining: 1 hr 15 mins. Vehicle: MH-47-EV-2026. Paid: ₹120.00."
  }
  ```

#### Possible Errors:
- `400 Bad Request`: Empty message or invalid payload.
- `401 Unauthorized`: Missing or invalid Bearer token.
- `500 Internal Server Error`: Unexpected AI controller error (handled gracefully).

