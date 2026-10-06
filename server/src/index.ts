import { createApp } from "./app.js";
import { prisma } from "./db.js";

const PORT = process.env.PORT || 5000;
const app = createApp();

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log(" Connected to SQLite Database via Prisma.");

    const server = app.listen(PORT, () => {
      console.log(` Park Ease API Server running at http://localhost:${PORT}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async () => {
      console.log("Shutting down Park Ease API server...");
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
