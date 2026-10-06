# Park Ease – Smart Parking Reservation Platform

Park Ease is a smart parking platform featuring a clean light UI, conflict-free booking, AI natural language assistant, demo payments, slot extension, and an admin dashboard.

## Project Structure
- `client/` - React 18, Vite, TypeScript, Tailwind CSS UI application.
- `server/` - Node.js Express REST API, Prisma ORM, SQLite database, AI Assistant service.

## Getting Started (Phase 1 Database Setup)
1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
3. Seed realistic sample data:
   ```bash
   npx prisma db seed
   ```
4. Explore data with Prisma Studio:
   ```bash
   npx prisma studio
   ```
