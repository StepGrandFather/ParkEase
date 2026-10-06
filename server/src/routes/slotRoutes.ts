import { Router } from "express";
import { getSlotById } from "../controllers/slotController.js";

const router = Router();

router.get("/:id", getSlotById);

export default router;
