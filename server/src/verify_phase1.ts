import { prisma } from "./db.js";

async function verifyPhase1() {
  console.log("=== PARK EASE PHASE 1 VERIFICATION ===");

  // 1. Verify Users
  const users = await prisma.user.findMany();
  console.log(`\n1. Users (${users.length} found):`);
  users.forEach((u) => console.log(`   - [${u.role}] ${u.name} <${u.email}>`));

  // 2. Verify Locations & their slots
  const locations = await prisma.location.findMany({
    include: {
      slots: true,
    },
  });
  console.log(`\n2. Locations (${locations.length} found):`);
  let totalSlots = 0;
  for (const loc of locations) {
    totalSlots += loc.slots.length;
    const evSlots = loc.slots.filter((s) => s.isEVCharging);
    const carSlots = loc.slots.filter((s) => s.vehicleType === "CAR");
    const suvSlots = loc.slots.filter((s) => s.vehicleType === "SUV");
    const bikeSlots = loc.slots.filter((s) => s.vehicleType === "BIKE");
    const floors = Array.from(new Set(loc.slots.map((s) => s.floor))).sort();

    console.log(`   - ${loc.name} (${loc.city}):`);
    console.log(`     * Rate: $${loc.hourlyRate.toFixed(2)}/hr | Capacity: ${loc.totalSpots} spots | Slots created: ${loc.slots.length}`);
    console.log(`     * Floors: [${floors.join(", ")}]`);
    console.log(`     * Breakdown: ${carSlots.length} Cars, ${suvSlots.length} SUVs, ${bikeSlots.length} Bikes, ${evSlots.length} EV Chargers`);
  }

  // 3. Verify Bookings with nested relations (User, Slot, Location, Payment)
  const bookings = await prisma.booking.findMany({
    include: {
      user: true,
      slot: {
        include: {
          location: true,
        },
      },
      payment: true,
    },
  });
  console.log(`\n3. Bookings & Payments (${bookings.length} found):`);
  for (const b of bookings) {
    console.log(`   - Booking ID: ${b.id}`);
    console.log(`     * Customer: ${b.user.name} (${b.user.email})`);
    console.log(`     * Vehicle: ${b.vehicleNumber} | Slot: ${b.slot.slotNumber} (Floor ${b.slot.floor}) at ${b.slot.location.name}`);
    console.log(`     * Window: ${b.startTime.toISOString()} -> ${b.endTime.toISOString()}`);
    console.log(`     * Status: ${b.status} | Total: $${b.totalAmount.toFixed(2)}`);
    if (b.payment) {
      console.log(`     * Payment: [${b.payment.paymentMethod}] TXN: ${b.payment.transactionId} - Status: ${b.payment.status}`);
    }
  }

  // 4. Foreign key / relational integrity check via raw SQL
  console.log("\n4. Relational Integrity Checks (Foreign Key Validations):");
  const orphanSlots: any[] = await prisma.$queryRaw`
    SELECT id, slotNumber FROM parking_slots WHERE locationId NOT IN (SELECT id FROM locations)
  `;
  const orphanBookings: any[] = await prisma.$queryRaw`
    SELECT id FROM bookings WHERE userId NOT IN (SELECT id FROM users) OR slotId NOT IN (SELECT id FROM parking_slots)
  `;
  const orphanPayments: any[] = await prisma.$queryRaw`
    SELECT id FROM payments WHERE bookingId NOT IN (SELECT id FROM bookings)
  `;

  console.log(`   - Orphan slots: ${orphanSlots.length} (Expected: 0)`);
  console.log(`   - Orphan bookings: ${orphanBookings.length} (Expected: 0)`);
  console.log(`   - Orphan payments: ${orphanPayments.length} (Expected: 0)`);

  if (orphanSlots.length === 0 && orphanBookings.length === 0 && orphanPayments.length === 0 && locations.length === 3 && totalSlots === 58 && bookings.length === 4) {
    console.log("\n========================================================");
    console.log("🎉 ALL PHASE 1 DATABASE & INTEGRITY CHECKS PASSED 100%!");
    console.log("========================================================");
  } else {
    throw new Error("Verification checks failed.");
  }
}

verifyPhase1()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
