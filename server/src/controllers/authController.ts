import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { generateToken } from "../utils/jwt.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { UserRole } from "../types/index.js";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return sendError(res, "Name, email, and password are required.", 400);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return sendError(res, "Please provide a valid email address.", 400);
    }

    if (password.length < 6) {
      return sendError(res, "Password must be at least 6 characters long.", 400);
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return sendError(res, "An account with this email address already exists.", 409);
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        role: UserRole.USER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(
      res,
      { user, token },
      "Registration successful! Welcome to Park Ease.",
      201
    );
  } catch (error: any) {
    return sendError(res, `Failed to register user: ${error.message}`, 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required.", 400);
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
      "Login successful."
    );
  } catch (error: any) {
    return sendError(res, `Failed to log in: ${error.message}`, 500);
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Unauthorized.", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!user) {
      return sendError(res, "User profile not found.", 404);
    }

    return sendSuccess(res, user, "User profile retrieved.");
  } catch (error: any) {
    return sendError(res, `Failed to retrieve profile: ${error.message}`, 500);
  }
}
