import { Router } from "express";
import {
  getAllLocations,
  getLocationById,
  getLocationAvailability,
} from "../controllers/locationController.js";
import { getSlotsByLocation } from "../controllers/slotController.js";

const router = Router();

router.get("/", getAllLocations);
router.get("/:id", getLocationById);
router.get("/:id/availability", getLocationAvailability);
router.get("/:locationId/slots", getSlotsByLocation);

export default router;
