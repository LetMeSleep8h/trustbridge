import jwt from "jsonwebtoken";
import { findUserById } from "../models/User.js";
import { SIGNING_SECRET } from "../config/secret.js";

const JWT_SECRET = SIGNING_SECRET;

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}