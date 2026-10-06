import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  // Global Middlewares
  app.use(cors());
  app.use(express.json());

  // Mount API
  app.use("/api", apiRouter);

  // 404 Catch-All
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `API route '${req.method} ${req.originalUrl}' not found.`,
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
