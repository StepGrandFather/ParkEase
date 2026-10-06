import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../db.js";
import { sendError } from "../utils/response.js";
import { AuthUser } from "../types/index.js";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Unauthorized. Bearer token is missing or malformed.", 401);
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return sendError(res, "Unauthorized. Token is invalid or expired.", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return sendError(res, "Unauthorized. User account not found.", 401);
    }

    req.user = user;
    next();
  } catch (error: any) {
    return sendError(res, `Authentication error: ${error.message}`, 500);
  }
}
