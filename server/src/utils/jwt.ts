import jwt from "jsonwebtoken";
import { JwtUserPayload } from "../types/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "park-ease-secret-key-2026-secure";
const JWT_EXPIRES_IN = "7d";

export function generateToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtUserPayload {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
}
