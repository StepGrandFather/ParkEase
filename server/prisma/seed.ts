import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Park Ease Database (Indian Context - Mumbai Hubs)...");

  // Clean existing records in reverse dependency order
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.parkingSlot.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Create Users
  console.log("Creating users with hashed passwords...");
  const admin = await prisma.user.create({
    data: {
      name: "Ananya Deshmukh",
      email: "admin@parkease.com",
      password: defaultPasswordHash,
      phone: "+91 98201 23456",
      role: "ADMIN",
    },
  });

  const userRahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      password: defaultPasswordHash,
      phone: "+91 98192 34567",
      role: "USER",
    },
  });

  const userPriya = await prisma.user.create({
    data: {
      name: "Priya Verma",
      email: "priya.verma@example.com",
      password: defaultPasswordHash,
      phone: "+91 98765 43210",
      role: "USER",
    },
  });

  const userAmit = await prisma.user.create({
    data: {
      name: "Amit Patel",
      email: "amit.patel@example.com",
      password: defaultPasswordHash,
      phone: "+91 97654 32109",
      role: "USER",
    },
  });

  // 2. Create Locations (Mumbai Smart Parking Hubs)
  console.log("Creating Mumbai parking locations with INR pricing...");
  const locPhoenix = await prisma.location.create({
    data: {
      name: "Phoenix Marketcity Mall - Kurla",
      address: "LBS Marg, Kurla West",
      city: "Mumbai",
      latitude: 19.0864,
      longitude: 72.8891,
      totalSpots: 24,
      hourlyRate: 60.0, // ₹60/hr
      imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
      description: "Premier shopping mall multi-level smart parking with dedicated EV fast charging bays, 24/7 security, and direct mall entrance.",
    },
  });

  const locJioWorld = await prisma.location.create({
    data: {
      name: "Jio World Centre - BKC",
      address: "G Block, Bandra Kurla Complex",
      city: "Mumbai",
      latitude: 19.0628,
      longitude: 72.8687,
      totalSpots: 18,
      hourlyRate: 100.0, // ₹100/hr
      imageUrl: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
      description: "World-class convention & business district automated parking facility with ultra-fast CCS2 EV charging stations and VIP concierge bays.",
    },
  });

  const locInorbit = await prisma.location.create({
    data: {
      name: "Inorbit Mall & PVR Cinemas - Malad",
      address: "New Link Road, Malad West",
      city: "Mumbai",
      latitude: 19.1762,
      longitude: 72.8364,
      totalSpots: 16,
      hourlyRate: 50.0, // ₹50/hr
      imageUrl: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
      description: "Convenient suburban mall parking adjacent to cinema multiplex and metro line with automated license plate recognition.",
    },
  });

  // 3. Create Slots for Location 1 (Phoenix Marketcity: 24 slots, Floors G, 1, 2)
  console.log("Creating slots for Phoenix Marketcity...");
  const phoenixSlots = [
    // Floor G
    { slotNumber: "G-01", floor: "G", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    { slotNumber: "G-02", floor: "G", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    { slotNumber: "G-03", floor: "G", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-04", floor: "G", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-05", floor: "G", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-06", floor: "G", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-07", floor: "G", vehicleType: "BIKE", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-08", floor: "G", vehicleType: "BIKE", isEVCharging: false, status: "AVAILABLE" },
    // Floor 1
    { slotNumber: "1-01", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-02", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-03", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-04", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-05", floor: "1", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-06", floor: "1", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-07", floor: "1", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    { slotNumber: "1-08", floor: "1", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    // Floor 2
    { slotNumber: "2-01", floor: "2", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "2-02", floor: "2", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "2-03", floor: "2", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "2-04", floor: "2", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "2-05", floor: "2", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "2-06", floor: "2", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "2-07", floor: "2", vehicleType: "BIKE", isEVCharging: false, status: "MAINTENANCE" },
    { slotNumber: "2-08", floor: "2", vehicleType: "BIKE", isEVCharging: false, status: "AVAILABLE" },
  ];

  const createdPhoenixSlots: Record<string, string> = {};
  for (const s of phoenixSlots) {
    const slot = await prisma.parkingSlot.create({
      data: { locationId: locPhoenix.id, ...s },
    });
    createdPhoenixSlots[s.slotNumber] = slot.id;
  }

  // 4. Create Slots for Location 2 (Jio World Centre: 18 slots, Floors G, 1)
  console.log("Creating slots for Jio World Centre...");
  const jioSlots = [
    // Floor G
    { slotNumber: "G-01", floor: "G", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    { slotNumber: "G-02", floor: "G", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    { slotNumber: "G-03", floor: "G", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    { slotNumber: "G-04", floor: "G", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-05", floor: "G", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-06", floor: "G", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-07", floor: "G", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-08", floor: "G", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-09", floor: "G", vehicleType: "BIKE", isEVCharging: false, status: "AVAILABLE" },
    // Floor 1
    { slotNumber: "1-01", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-02", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-03", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-04", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-05", floor: "1", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-06", floor: "1", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-07", floor: "1", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-08", floor: "1", vehicleType: "BIKE", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-09", floor: "1", vehicleType: "BIKE", isEVCharging: false, status: "AVAILABLE" },
  ];

  const createdJioSlots: Record<string, string> = {};
  for (const s of jioSlots) {
    const slot = await prisma.parkingSlot.create({
      data: { locationId: locJioWorld.id, ...s },
    });
    createdJioSlots[s.slotNumber] = slot.id;
  }

  // 5. Create Slots for Location 3 (Inorbit Mall: 16 slots, Floors G, 1)
  console.log("Creating slots for Inorbit Mall & Cinemas...");
  const inorbitSlots = [
    // Floor G
    { slotNumber: "G-01", floor: "G", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    { slotNumber: "G-02", floor: "G", vehicleType: "EV", isEVCharging: true, status: "AVAILABLE" },
    { slotNumber: "G-03", floor: "G", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-04", floor: "G", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-05", floor: "G", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-06", floor: "G", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-07", floor: "G", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "G-08", floor: "G", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    // Floor 1
    { slotNumber: "1-01", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-02", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-03", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-04", floor: "1", vehicleType: "CAR", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-05", floor: "1", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-06", floor: "1", vehicleType: "SUV", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-07", floor: "1", vehicleType: "BIKE", isEVCharging: false, status: "AVAILABLE" },
    { slotNumber: "1-08", floor: "1", vehicleType: "BIKE", isEVCharging: false, status: "AVAILABLE" },
  ];

  const createdInorbitSlots: Record<string, string> = {};
  for (const s of inorbitSlots) {
    const slot = await prisma.parkingSlot.create({
      data: { locationId: locInorbit.id, ...s },
    });
    createdInorbitSlots[s.slotNumber] = slot.id;
  }

  // 6. Create Realistic Bookings & Payments with Indian Vehicles & QR Payload
  console.log("Creating Indian vehicle bookings & demo payments...");
  const now = new Date();

  // Booking 1: Active Booking for Rahul Sharma (Phoenix G-01 EV)
  const b1Start = new Date(now.getTime() - 45 * 60 * 1000); // 45 mins ago
  const b1End = new Date(now.getTime() + 75 * 60 * 1000); // 1 hr 15 mins left (2 hrs total = ₹120)
  const booking1 = await prisma.booking.create({
    data: {
      bookingReference: "PE-MUM-2026-0001",
      userId: userRahul.id,
      slotId: createdPhoenixSlots["G-01"],
      vehicleNumber: "MH-47-EV-2026",
      startTime: b1Start,
      endTime: b1End,
      totalAmount: 120.0,
      status: "ACTIVE",
      paymentStatus: "PAID",
      qrCodeData: JSON.stringify({
        bookingRef: "PE-MUM-2026-0001",
        location: locPhoenix.name,
        slot: "G-01",
        floor: "G",
        vehicle: "MH-47-EV-2026",
        start: b1Start.toISOString(),
        end: b1End.toISOString(),
      }),
      payment: {
        create: {
          transactionId: "TXN-DEMO-UPI-992140",
          paymentMethod: "UPI",
          amount: 120.0,
          status: "SUCCESS",
        },
      },
    },
  });

  // Booking 2: Confirmed Upcoming Booking for Priya Verma (Phoenix 1-05 SUV tomorrow)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const b2End = new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000); // 4 hrs = ₹240
  const booking2 = await prisma.booking.create({
    data: {
      bookingReference: "PE-MUM-2026-0002",
      userId: userPriya.id,
      slotId: createdPhoenixSlots["1-05"],
      vehicleNumber: "MH-02-EE-1984",
      startTime: tomorrow,
      endTime: b2End,
      totalAmount: 240.0,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      qrCodeData: JSON.stringify({
        bookingRef: "PE-MUM-2026-0002",
        location: locPhoenix.name,
        slot: "1-05",
        floor: "1",
        vehicle: "MH-02-EE-1984",
        start: tomorrow.toISOString(),
        end: b2End.toISOString(),
      }),
      payment: {
        create: {
          transactionId: "TXN-DEMO-CARD-441209",
          paymentMethod: "CARD",
          amount: 240.0,
          status: "SUCCESS",
        },
      },
    },
  });

  // Booking 3: Completed Historical Booking for Amit Patel (Jio World G-02 EV yesterday)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);
  const b3End = new Date(yesterday.getTime() + 2 * 60 * 60 * 1000); // 2 hrs = ₹200
  const booking3 = await prisma.booking.create({
    data: {
      bookingReference: "PE-MUM-2026-0003",
      userId: userAmit.id,
      slotId: createdJioSlots["G-02"],
      vehicleNumber: "MH-01-BK-4521",
      startTime: yesterday,
      endTime: b3End,
      totalAmount: 200.0,
      status: "COMPLETED",
      paymentStatus: "PAID",
      qrCodeData: JSON.stringify({
        bookingRef: "PE-MUM-2026-0003",
        location: locJioWorld.name,
        slot: "G-02",
        floor: "G",
        vehicle: "MH-01-BK-4521",
        start: yesterday.toISOString(),
        end: b3End.toISOString(),
      }),
      payment: {
        create: {
          transactionId: "TXN-DEMO-WALLET-100234",
          paymentMethod: "DEMO_WALLET",
          amount: 200.0,
          status: "SUCCESS",
        },
      },
    },
  });

  // Booking 4: Upcoming Booking for Rahul Sharma (Inorbit Mall G-06 SUV)
  const inThreeDays = new Date(now);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  inThreeDays.setHours(16, 0, 0, 0);
  const b4End = new Date(inThreeDays.getTime() + 3 * 60 * 60 * 1000); // 3 hrs = ₹150
  const booking4 = await prisma.booking.create({
    data: {
      bookingReference: "PE-MUM-2026-0004",
      userId: userRahul.id,
      slotId: createdInorbitSlots["G-06"],
      vehicleNumber: "MH-03-CD-8899",
      startTime: inThreeDays,
      endTime: b4End,
      totalAmount: 150.0,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      qrCodeData: JSON.stringify({
        bookingRef: "PE-MUM-2026-0004",
        location: locInorbit.name,
        slot: "G-06",
        floor: "G",
        vehicle: "MH-03-CD-8899",
        start: inThreeDays.toISOString(),
        end: b4End.toISOString(),
      }),
      payment: {
        create: {
          transactionId: "TXN-DEMO-UPI-884102",
          paymentMethod: "UPI",
          amount: 150.0,
          status: "SUCCESS",
        },
      },
    },
  });

  console.log("✅ Indian Context Seed completed successfully!");
  console.log({
    usersCreated: 4,
    locationsCreated: 3,
    totalSlotsCreated: phoenixSlots.length + jioSlots.length + inorbitSlots.length,
    bookingsCreated: 4,
    paymentsCreated: 4,
  });
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
