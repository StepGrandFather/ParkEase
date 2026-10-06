import { Router } from "express";
import {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  extendBooking,
} from "../controllers/bookingController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// All booking routes require authentication
router.use(authenticate);

router.post("/", createBooking);
router.get("/", getUserBookings);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);
router.post("/:id/extend", extendBooking);

export default router;
