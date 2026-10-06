import { Router } from "express";
import { handleAIChat } from "../controllers/aiController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// All AI assistant routes require authenticated driver/user
router.use(authenticate);

router.post("/chat", handleAIChat);

export default router;
