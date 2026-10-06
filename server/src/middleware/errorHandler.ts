import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Unhandled Error:", err);

  if (err.name === "PrismaClientKnownRequestError") {
    // Unique constraint violation in Prisma
    if (err.code === "P2002") {
      const field = err.meta?.target ? ` (${err.meta.target})` : "";
      return sendError(res, `A record with this identifier already exists${field}.`, 409);
    }
    // Record not found
    if (err.code === "P2025") {
      return sendError(res, "The requested record was not found.", 404);
    }
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";
  return sendError(res, message, statusCode);
}
