import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";
import { UserRole } from "../types/index.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, "Unauthorized. Authentication required.", 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    return sendError(res, "Forbidden. Administrator privileges required to perform this action.", 403);
  }

  next();
}
