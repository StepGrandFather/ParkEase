import http from "http";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING PARK EASE PHASE 2 AUTOMATED TEST SUITE");
  console.log("=================================================");

  const app = createApp();
  const server = http.createServer(app);

  const TEST_PORT = 5088;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  const BASE_URL = `http://localhost:${TEST_PORT}/api`;

  let userToken = "";
  let adminToken = "";
  let testUserId = "";
  let testLocationId = "";
  let testSlotId = "";
  let testBookingId = "";
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, details ? details : "");
      failCount++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: User Registration
    // -------------------------------------------------------------
    const testEmail = `test.driver.${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Driver",
        email: testEmail,
        password: "password123",
        phone: "+91 99999 88888",
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success && regData.data.token, "1. User Registration (POST /api/auth/register)");
    testUserId = regData.data.user.id;

    // -------------------------------------------------------------
    // Test 2: User Login
    // -------------------------------------------------------------
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "password123",
      }),
    });
    const loginData = await loginRes.json();
    userToken = loginData.data?.token;
    assert(loginRes.status === 200 && loginData.success && userToken, "2. User Login & JWT Issuance (POST /api/auth/login)");

    // -------------------------------------------------------------
    // Test 3: Protected Route (GET /api/auth/me)
    // -------------------------------------------------------------
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data.email === testEmail, "3. Protected Route with Bearer Token (GET /api/auth/me)");

    // -------------------------------------------------------------
    // Test 4: Location Retrieval (GET /api/locations)
    // -------------------------------------------------------------
    const locRes = await fetch(`${BASE_URL}/locations`);
    const locData = await locRes.json();
    assert(locRes.status === 200 && locData.data.length >= 3, "4. Location Retrieval (GET /api/locations)");
    testLocationId = locData.data[0].id;

    // -------------------------------------------------------------
    // Test 5: Availability Search & Conflict Engine
    // -------------------------------------------------------------
    const randomDays = 5 + Math.floor(Math.random() * 50);
    const tomorrow = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);
    tomorrow.setHours(12, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const availRes = await fetch(
      `${BASE_URL}/locations/${testLocationId}/availability?startTime=${tomorrow.toISOString()}&endTime=${tomorrowEnd.toISOString()}&vehicleType=CAR`
    );
    const availData = await availRes.json();
    assert(
      availRes.status === 200 &&
        availData.success &&
        availData.data.availableSlots.length > 0 &&
        availData.data.timeWindow.estimatedTotal.startsWith("₹"),
      "5. Availability Search with Conflict Filter & INR Calculation (GET /api/locations/:id/availability)"
    );
    testSlotId = availData.data.availableSlots[0].id;

    // -------------------------------------------------------------
    // Test 6: Successful Booking Creation
    // -------------------------------------------------------------
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        slotId: testSlotId,
        vehicleNumber: "MH-02-TEST-9999",
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
        paymentMethod: "UPI",
      }),
    });
    const bookData = await bookRes.json();
    testBookingId = bookData.data?.booking?.id;
    assert(
      bookRes.status === 201 &&
        bookData.success &&
        bookData.data.booking.bookingReference &&
        bookData.data.booking.qrCodeData &&
        bookData.data.pricing.currency === "INR",
      "6. Successful Booking with Atomic Conflict Lock, QR & Reference (POST /api/bookings)"
    );

    // -------------------------------------------------------------
    // Test 7: Double-Booking Prevention (Conflict Check)
    // -------------------------------------------------------------
    const conflictRes = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        slotId: testSlotId,
        vehicleNumber: "MH-01-RACE-1111",
        startTime: new Date(tomorrow.getTime() + 30 * 60 * 1000).toISOString(), // Overlaps by 30 mins
        endTime: new Date(tomorrowEnd.getTime() + 30 * 60 * 1000).toISOString(),
        paymentMethod: "CARD",
      }),
    });
    const conflictData = await conflictRes.json();
    assert(
      conflictRes.status === 409 && conflictData.success === false,
      "7. Double-Booking Prevention / Concurrency Conflict (POST /api/bookings -> 409 Conflict)"
    );

    // -------------------------------------------------------------
    // Test 8: Booking Extension (POST /api/bookings/:id/extend)
    // -------------------------------------------------------------
    const extendRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/extend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        extendHours: 1, // Extend by 1 hour
      }),
    });
    const extendData = await extendRes.json();
    assert(
      extendRes.status === 200 &&
        extendData.success &&
        extendData.data.additionalCharge.durationHours === 1,
      "8. Booking Extension with Conflict Re-check (POST /api/bookings/:id/extend)"
    );

    // -------------------------------------------------------------
    // Test 9: Booking Cancellation & Demo Refund (PATCH /api/bookings/:id/cancel)
    // -------------------------------------------------------------
    const cancelRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const cancelData = await cancelRes.json();
    assert(
      cancelRes.status === 200 &&
        cancelData.success &&
        cancelData.data.booking.status === "CANCELLED" &&
        cancelData.data.refundSimulated === true,
      "9. Booking Cancellation & Demo Refund (PATCH /api/bookings/:id/cancel)"
    );

    // -------------------------------------------------------------
    // Test 10: Demo Payment Simulation - Success
    // -------------------------------------------------------------
    // Create a temporary booking to test payments
    const payBookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        slotId: testSlotId,
        vehicleNumber: "MH-04-PAY-1234",
        startTime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        paymentMethod: "DEMO_WALLET",
      }),
    });
    const payBookingData = await payBookingRes.json();
    const payBookingId = payBookingData.data.booking.id;

    const paySuccessRes = await fetch(`${BASE_URL}/payments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        bookingId: payBookingId,
        paymentMethod: "UPI",
        simulateStatus: "SUCCESS",
      }),
    });
    const paySuccessData = await paySuccessRes.json();
    assert(
      paySuccessRes.status === 201 &&
        paySuccessData.success &&
        paySuccessData.data.isDemo &&
        paySuccessData.data.payment.status === "SUCCESS",
      "10. Demo Payment Gateway - SUCCESS Simulation (POST /api/payments/create)"
    );

    // -------------------------------------------------------------
    // Test 11: Demo Payment Simulation - FAILED
    // -------------------------------------------------------------
    const payFailRes = await fetch(`${BASE_URL}/payments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        bookingId: payBookingId,
        paymentMethod: "CARD",
        simulateStatus: "FAILED",
      }),
    });
    const payFailData = await payFailRes.json();
    assert(
      payFailRes.status === 201 &&
        payFailData.success &&
        payFailData.data.payment.status === "FAILED",
      "11. Demo Payment Gateway - FAILED Simulation (POST /api/payments/create)"
    );

    // -------------------------------------------------------------
    // Test 12: Admin Authorization & Role-Based Middleware
    // -------------------------------------------------------------
    // Non-admin attempting to access admin dashboard
    const forbiddenRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      forbiddenRes.status === 403,
      "12a. Role Middleware Blocks Non-Admin (GET /api/admin/dashboard -> 403 Forbidden)"
    );

    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@parkease.com",
        password: "password123",
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data.token;

    // Admin dashboard access
    const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDashData = await adminDashRes.json();
    assert(
      adminDashRes.status === 200 &&
        adminDashData.success &&
        adminDashData.data.summary.totalLocations >= 3 &&
        adminDashData.data.revenue.currency === "INR",
      "12b. Admin Dashboard Access (GET /api/admin/dashboard -> 200 OK)"
    );

    // -------------------------------------------------------------
    // Test 13: Admin Slot Update / Maintenance Toggle
    // -------------------------------------------------------------
    const patchSlotRes = await fetch(`${BASE_URL}/admin/slots/${testSlotId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "MAINTENANCE",
      }),
    });
    const patchSlotData = await patchSlotRes.json();
    assert(
      patchSlotRes.status === 200 && patchSlotData.data.status === "MAINTENANCE",
      "13. Admin Slot Management & Maintenance Mode (PATCH /api/admin/slots/:id)"
    );

    // Restore slot to AVAILABLE
    await fetch(`${BASE_URL}/admin/slots/${testSlotId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "AVAILABLE" }),
    });

  } catch (err: any) {
    console.error("Test execution caught error:", err);
    failCount++;
  } finally {
    server.close();
    await prisma.$disconnect();

    console.log("\n=================================================");
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("=================================================");

    if (failCount > 0) {
      process.exit(1);
    } else {
      console.log("🎉 ALL PHASE 2 AUTOMATED API TESTS PASSED 100%!");
      process.exit(0);
    }
  }
}

runTests();
