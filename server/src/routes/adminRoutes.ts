import { Router } from "express";
import {
  getAdminDashboard,
  getAdminBookings,
  getAdminUsers,
  createAdminLocation,
  updateAdminLocation,
  createAdminSlot,
  updateAdminSlot,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

// All admin routes strictly require valid authentication AND ADMIN role
router.use(authenticate, requireAdmin);

router.get("/dashboard", getAdminDashboard);
router.get("/bookings", getAdminBookings);
router.get("/users", getAdminUsers);
router.post("/locations", createAdminLocation);
router.patch("/locations/:id", updateAdminLocation);
router.post("/slots", createAdminSlot);
router.patch("/slots/:id", updateAdminSlot);

export default router;
