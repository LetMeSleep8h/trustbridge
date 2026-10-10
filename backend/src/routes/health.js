import { Router } from "express";
import { NETWORK_NAME } from "../services/stellar.js";

const router = Router();

// Public liveness probe. Keep it minimal: no memory, uptime or version details.
router.get("/", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), network: NETWORK_NAME });
});

router.get("/ping", (req, res) => {
  res.json({ pong: true });
});

export default router;
