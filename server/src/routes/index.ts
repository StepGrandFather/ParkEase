import { Router } from "express";
import authRoutes from "./authRoutes.js";
import locationRoutes from "./locationRoutes.js";
import slotRoutes from "./slotRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import adminRoutes from "./adminRoutes.js";
import aiRoutes from "./aiRoutes.js";

const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Park Ease API",
    version: "1.0.0",
    currency: "INR (₹)",
    time: new Date().toISOString(),
  });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/locations", locationRoutes);
apiRouter.use("/slots", slotRoutes);
apiRouter.use("/bookings", bookingRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/ai", aiRoutes);

export default apiRouter;
