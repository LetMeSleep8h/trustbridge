import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";

import campaignRoutes from "./routes/campaigns.js";
import transactionRoutes from "./routes/transactions.js";
import walletRoutes from "./routes/wallet.js";
import analyticsRoutes from "./routes/analytics.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import oauthRoutes from "./routes/oauth.js";
import adminRoutes from "./routes/admin.js";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// Render (and most hosts) sit behind a reverse proxy. Without this, every
// request appears to come from the proxy's IP and rate limits are shared.
if (isProduction) app.set("trust proxy", 1);

app.use(helmet());

const DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:5000"];
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean)
  : DEFAULT_ORIGINS;

if (!isProduction) console.log("[CORS] Allowed origins:", allowedOrigins);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (curl, server-to-server, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow any localhost port (Vite bumps ports when busy)
    if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests" } });
app.use("/api/", limiter);

// Stricter limit on credential endpoints to slow down brute-force attempts.
// Successful logins are not counted, so legitimate users are not locked out.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});
app.use(["/api/auth/login", "/api/auth/register", "/api/auth/change-password", "/api/auth/github/callback"], authLimiter);

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not Found", message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;