-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingReference" TEXT,
    "userId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "holdExpiresAt" DATETIME,
    "qrCodeData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "parking_slots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("createdAt", "endTime", "holdExpiresAt", "id", "qrCodeData", "slotId", "startTime", "status", "totalAmount", "updatedAt", "userId", "vehicleNumber") SELECT "createdAt", "endTime", "holdExpiresAt", "id", "qrCodeData", "slotId", "startTime", "status", "totalAmount", "updatedAt", "userId", "vehicleNumber" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE UNIQUE INDEX "bookings_bookingReference_key" ON "bookings"("bookingReference");
CREATE INDEX "bookings_slotId_startTime_endTime_idx" ON "bookings"("slotId", "startTime", "endTime");
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58qRj5s0b7JjL1kY2/H9c1HkH7Gy',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "phone", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "phone", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
