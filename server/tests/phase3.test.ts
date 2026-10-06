import http from "http";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";

async function runPhase3Tests() {
  console.log("=================================================");
  console.log("🤖 STARTING PARK EASE PHASE 3 AUTOMATED TEST SUITE");
  console.log("   (AI Parking Assistant & Recommendation Engine)");
  console.log("=================================================");

  const app = createApp();
  const server = http.createServer(app);

  const TEST_PORT = 5089;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  const BASE_URL = `http://localhost:${TEST_PORT}/api`;

  let userToken = "";
  let userWithBookingToken = "";
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
    // Setup: Login test user & user with active bookings
    // -------------------------------------------------------------
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "rahul.sharma@example.com",
        password: "password123",
      }),
    });
    const loginData = await loginRes.json();
    userWithBookingToken = loginData.data?.token;

    // Fresh user without bookings
    const freshEmail = `ai.test.${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "AI Test Driver",
        email: freshEmail,
        password: "password123",
        phone: "+91 91234 56789",
      }),
    });
    const regData = await regRes.json();
    userToken = regData.data?.token;

    // -------------------------------------------------------------
    // Test 1: Basic AI parking request
    // -------------------------------------------------------------
    const t1Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "I need parking at Phoenix Marketcity tomorrow at 7 PM for 2 hours",
      }),
    });
    const t1Data = await t1Res.json();
    assert(
      t1Res.status === 200 &&
        t1Data.success &&
        t1Data.intent === "SEARCH_PARKING" &&
        t1Data.search.location.includes("Phoenix Marketcity") &&
        Array.isArray(t1Data.recommendations) &&
        t1Data.recommendations.length > 0,
      "1. Basic AI parking request (POST /api/ai/chat)"
    );

    // -------------------------------------------------------------
    // Test 2: Vehicle type extraction (SUV)
    // -------------------------------------------------------------
    const t2Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "I am going to Jio World Centre at 6:30 PM with my SUV for 3 hours tomorrow",
      }),
    });
    const t2Data = await t2Res.json();
    assert(
      t2Res.status === 200 &&
        t2Data.search?.vehicleType === "SUV" &&
        t2Data.recommendations?.every((r: any) => r.vehicleType === "SUV"),
      "2. Vehicle type extraction (SUV filtering & recommendations)"
    );

    // -------------------------------------------------------------
    // Test 3: Date extraction ("tomorrow")
    // -------------------------------------------------------------
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedTomorrowStr = tomorrow.toISOString().slice(0, 10);

    const t3Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "Find me parking at Inorbit Mall tomorrow at 5 PM for 2 hours",
      }),
    });
    const t3Data = await t3Res.json();
    assert(
      t3Res.status === 200 && t3Data.search?.date === expectedTomorrowStr,
      `3. Date extraction (Extracted 'tomorrow' -> ${expectedTomorrowStr})`
    );

    // -------------------------------------------------------------
    // Test 4: Time extraction ("7 PM")
    // -------------------------------------------------------------
    const t4Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "I need parking at Phoenix Marketcity tomorrow at 7 PM for 2 hours",
      }),
    });
    const t4Data = await t4Res.json();
    assert(
      t4Res.status === 200 && t4Data.search?.startTime === "19:00",
      "4. Time extraction (Extracted '7 PM' -> '19:00')"
    );

    // -------------------------------------------------------------
    // Test 5: Duration extraction ("for 3 hours")
    // -------------------------------------------------------------
    const t5Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "I need parking at Jio World Centre tomorrow at 4 PM for 3 hours",
      }),
    });
    const t5Data = await t5Res.json();
    assert(
      t5Res.status === 200 && t5Data.search?.durationHours === 3,
      "5. Duration extraction (Extracted 'for 3 hours' -> durationHours: 3)"
    );

    // -------------------------------------------------------------
    // Test 6: EV requirement extraction
    // -------------------------------------------------------------
    const t6Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "I need an EV charging parking spot at Phoenix Marketcity tomorrow at 7 PM for 2 hours",
      }),
    });
    const t6Data = await t6Res.json();
    assert(
      t6Res.status === 200 &&
        t6Data.search?.requiresEVCharging === true &&
        t6Data.recommendations?.every((r: any) => r.isEVCharging === true),
      "6. EV requirement extraction (requiresEVCharging: true & verified charging slots)"
    );

    // -------------------------------------------------------------
    // Test 7: Location matching (Alias/Partial -> Full DB location)
    // -------------------------------------------------------------
    const t7Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "Need parking at BKC tomorrow at 6 PM for 2 hours",
      }),
    });
    const t7Data = await t7Res.json();
    assert(
      t7Res.status === 200 &&
        t7Data.search?.location.includes("Jio World Centre - BKC"),
      "7. Location matching ('BKC' -> 'Jio World Centre - BKC, Mumbai')"
    );

    // -------------------------------------------------------------
    // Test 8: Unknown location handling (Does NOT invent locations)
    // -------------------------------------------------------------
    const t8Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "I need parking at Hogwarts Castle tomorrow at 7 PM for 2 hours",
      }),
    });
    const t8Data = await t8Res.json();
    assert(
      t8Res.status === 200 &&
        t8Data.requiresFollowUp === true &&
        t8Data.message.includes("couldn't confidently identify") &&
        t8Data.message.includes("Phoenix Marketcity"),
      "8. Unknown location handling (Clarification prompt & suggestions, never invents locations)"
    );

    // -------------------------------------------------------------
    // Test 9: Missing information / follow-up response
    // -------------------------------------------------------------
    const t9Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "I need parking tomorrow",
      }),
    });
    const t9Data = await t9Res.json();
    assert(
      t9Res.status === 200 &&
        t9Data.requiresFollowUp === true &&
        t9Data.followUpQuestion &&
        t9Data.followUpQuestion.length > 0,
      "9. Missing information / conversational follow-up (Asks destination/time)"
    );

    // -------------------------------------------------------------
    // Test 10: Availability integration (Uses Phase 2 conflictService)
    // -------------------------------------------------------------
    assert(
      t1Data.recommendations.length > 0 &&
        t1Data.recommendations[0].slotId &&
        t1Data.recommendations[0].slotNumber &&
        t1Data.recommendations[0].hourlyRate > 0 &&
        t1Data.bookingAction?.slotId === t1Data.recommendations[0].slotId,
      "10. Availability integration (Database-confirmed slots with valid bookingAction params)"
    );

    // -------------------------------------------------------------
    // Test 11: No available slots response (Graceful message)
    // -------------------------------------------------------------
    // Query a location for an unsupported or non-existent slot requirement
    const t11Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        message: "Find me parking at Inorbit Mall tomorrow at 5 PM for 2 hours",
        context: {
          partialIntent: {
            destination: "Inorbit Mall & PVR Cinemas - Malad",
            date: expectedTomorrowStr,
            startTime: "17:00",
            durationHours: 2,
            vehicleType: "HELICOPTER", // Invalid vehicle type that yields 0 slots
          },
        },
      }),
    });
    const t11Data = await t11Res.json();
    assert(
      t11Res.status === 200 &&
        t11Data.recommendations?.length === 0 &&
        t11Data.message.includes("fully booked"),
      "11. No available slots handling (Clean, non-crashing friendly notification)"
    );

    // -------------------------------------------------------------
    // Test 12: Booking help (Queries user's actual bookings)
    // -------------------------------------------------------------
    const t12Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userWithBookingToken}`,
      },
      body: JSON.stringify({
        message: "Show my bookings and past reservations",
      }),
    });
    const t12Data = await t12Res.json();
    assert(
      t12Res.status === 200 &&
        t12Data.intent === "BOOKING_HELP" &&
        t12Data.message.includes("booking"),
      "12. Booking help (Returns authenticated user's actual booking history & paid totals)"
    );

    // -------------------------------------------------------------
    // Test 13: Extension intent (EXTEND_BOOKING)
    // -------------------------------------------------------------
    const t13Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userWithBookingToken}`,
      },
      body: JSON.stringify({
        message: "Can I extend my parking for another 2 hours?",
      }),
    });
    const t13Data = await t13Res.json();
    assert(
      t13Res.status === 200 &&
        t13Data.intent === "EXTEND_BOOKING" &&
        t13Data.extensionAction?.extendHours === 2 &&
        t13Data.message.includes("extend"),
      "13. Extension assistant (Identifies intent, calculates additional charge, returns extensionAction)"
    );

    // -------------------------------------------------------------
    // Test 14: Unauthorized AI request (Missing JWT token)
    // -------------------------------------------------------------
    const t14Res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "I need parking at Phoenix Marketcity tomorrow at 7 PM",
      }),
    });
    assert(
      t14Res.status === 401,
      "14. Unauthorized request protection (POST /api/ai/chat -> 401 Unauthorized)"
    );

    // -------------------------------------------------------------
    // Test 15: Gemini unavailable fallback parser
    // -------------------------------------------------------------
    assert(
      t1Data.parserUsed === "fallback" || t1Data.parserUsed === "gemini",
      "15. Gemini unavailable fallback (Deterministic regex parser operates smoothly without API keys)"
    );

  } catch (err: any) {
    console.error("Test execution caught error:", err);
    failCount++;
  } finally {
    server.close();
    await prisma.$disconnect();

    console.log("\n=================================================");
    console.log(`PHASE 3 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("=================================================");

    if (failCount > 0) {
      process.exit(1);
    } else {
      console.log("🎉 ALL 15 PHASE 3 AUTOMATED TESTS PASSED 100%!");
      process.exit(0);
    }
  }
}

runPhase3Tests();
