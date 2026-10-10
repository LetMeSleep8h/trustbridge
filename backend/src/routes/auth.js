import { Router } from "express";
import { body, validationResult } from "express-validator";
import { createUser, findUserByEmail, findUserById, updateUser, comparePassword, changePassword } from "../models/User.js";
import { StrKey } from "@stellar/stellar-sdk";
import { signToken, verifyToken } from "../middleware/auth.js";

const router = Router();

function serializeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    walletAddress: user.walletAddress,
    avatar: user.avatar,
    gender: user.gender,
    country: user.country,
    bio: user.bio,
    facebook: user.facebook,
    instagram: user.instagram,
    youtube: user.youtube,
    emailNotifications: user.emailNotifications ?? 1,
    role: user.role || "user",
    joined: user.created_at,
  };
}

// Register
router.post(
  "/register",
  [
    body("firstName").isLength({ min: 1 }).trim(),
    body("lastName").isLength({ min: 1 }).trim(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("confirmPassword").custom((value, { req }) => value === req.body.password),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const { firstName, lastName, email, password, avatar, gender, country, bio, facebook, instagram, youtube } = req.body;
      const existing = await findUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already registered" });
      const user = await createUser({ firstName, lastName, email, password, avatar, gender, country, bio, facebook, instagram, youtube });
      const token = signToken(user);
      res.status(201).json({ token, user: serializeUser(user) });
    } catch (err) {
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const { email, password } = req.body;
      const user = await findUserByEmail(email);
      // Same message for unknown email and wrong password so the endpoint
      // cannot be used to discover which emails are registered.
      // Accounts created through GitHub have no password and cannot use this route.
      if (!user || !user.password || !(await comparePassword(user, password))) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = signToken(user);
      res.json({ token, user: serializeUser(user) });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// Get profile
router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: serializeUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Update profile
router.put("/profile", async (req, res) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(token);
    const allowedFields = ["firstName", "lastName", "bio", "avatar", "gender", "country", "facebook", "instagram", "youtube", "walletAddress"];
    const fields = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }
    for (const [key, value] of Object.entries(fields)) {
      if (value === null) continue;
      if (typeof value !== "string") {
        return res.status(400).json({ error: `Invalid value for ${key}` });
      }
      fields[key] = value.trim().slice(0, key === "bio" ? 1000 : 300);
    }
    if (fields.walletAddress) {
      if (typeof fields.walletAddress !== "string" || !StrKey.isValidEd25519PublicKey(fields.walletAddress)) {
        return res.status(400).json({ error: "Invalid Stellar wallet address" });
      }
    }
    if (Object.keys(fields).length > 0) {
      await updateUser(decoded.id, fields);
    }
    const user = await findUserById(decoded.id);
    res.json({ user: serializeUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Toggle email notifications on/off (Issue #10)
router.put("/notifications", async (req, res) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const enabled = Boolean(req.body.enabled);
    await updateUser(decoded.id, { emailNotifications: enabled ? 1 : 0 });
    const updated = await findUserById(decoded.id);
    res.json({ user: serializeUser(updated) });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Unsubscribe from email notifications (used by the unsubscribe link in emails)
router.get("/unsubscribe", async (req, res) => {
  try {
    const { email, user } = req.query;
    if (!email || !user) {
      return res.status(400).json({ error: "Missing email or user parameter" });
    }
    const existing = await findUserByEmail(email);
    if (!existing || String(existing.id) !== String(user)) {
      return res.status(404).json({ error: "User not found" });
    }
    await updateUser(existing.id, { emailNotifications: 0 });
    res.type("html").send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Unsubscribed — TrustBridge</title></head>
<body style="background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;">
  <div style="max-width:480px;background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);text-align:center;">
    <div style="font-size:20px;font-weight:800;color:#6366f1;">TrustBridge</div>
    <h1 style="font-size:22px;color:#0f172a;margin:20px 0 8px;">You've been unsubscribed</h1>
    <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0;">We won't send you any more email notifications. You can re-enable them any time from your TrustBridge account settings.</p>
    <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/settings" style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">Open Settings</a>
  </div>
</body>
</html>`);
  } catch {
    res.status(500).json({ error: "Unsubscribe failed" });
  }
});

// Change password
router.put("/change-password", async (req, res) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!(await comparePassword(user, oldPassword))) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    await changePassword(decoded.id, newPassword);
    res.json({ message: "Password changed successfully" });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;