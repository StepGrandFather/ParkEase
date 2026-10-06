import { Router } from "express";
import { createPayment, verifyPayment } from "../controllers/paymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Protected routes for demo payments
router.use(authenticate);

router.post("/create", createPayment);
router.post("/:id/verify", verifyPayment);

export default router;
