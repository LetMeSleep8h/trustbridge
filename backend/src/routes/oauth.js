import { Router } from "express";
import crypto from "node:crypto";
import axios from "axios";
import { createUser, findUserByEmail, findUserByGithubId, findUserById, updateUser } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { serializeUser } from "../utils/serializeUser.js";

const router = Router();

const GITHUB_SCOPE = "read:user user:email";

function frontendUrl() {
  const first = (process.env.FRONTEND_URL || "").split(",")[0].trim().replace(/\/+$/, "");
  return first || "http://localhost:5173";
}

function redirectUri() {
  return `${frontendUrl()}/auth/github/callback`;
}

// Build the GitHub consent URL. The random `state` is returned to the browser,
// which stores it and must see the same value come back on the callback
// (checked in the frontend), preventing login CSRF.
router.get("/github/url", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: "GitHub sign-in is not configured" });
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: GITHUB_SCOPE,
    state,
  });
  res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}`, state });
});

// GitHub OAuth callback: the frontend sends us the one-time code.
router.post("/github/callback", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") return res.status(400).json({ error: "Missing code" });

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri(),
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) return res.status(400).json({ error: "Failed to get access token" });

    const headers = { Authorization: `Bearer ${accessToken}` };
    const [userRes, emailRes] = await Promise.all([
      axios.get("https://api.github.com/user", { headers }),
      axios.get("https://api.github.com/user/emails", { headers }),
    ]);

    const githubProfile = userRes.data;
    const githubId = String(githubProfile.id);

    // Only trust an email GitHub has verified. Otherwise anyone could add
    // someone else's address to their GitHub account and take over that user.
    const verified = (emailRes.data || []).filter((e) => e.verified);
    const primaryEmail = (verified.find((e) => e.primary) || verified[0])?.email;
    if (!primaryEmail) {
      return res.status(400).json({ error: "Your GitHub account has no verified email address" });
    }
    const email = primaryEmail.toLowerCase();

    let user = await findUserByGithubId(githubId);
    if (!user) {
      const existing = await findUserByEmail(email);
      if (existing) {
        await updateUser(existing.id, {
          github_id: githubId,
          auth_provider: "github",
          avatar: existing.avatar || githubProfile.avatar_url || null,
        });
        user = existing;
      } else {
        const nameParts = githubProfile.name?.split(" ") || [];
        const created = await createUser({
          firstName: nameParts[0] || githubProfile.login || "GitHub",
          lastName: nameParts.slice(1).join(" ") || "User",
          email,
          password: null,
          avatar: githubProfile.avatar_url || null,
        });
        await updateUser(created.id, { github_id: githubId, auth_provider: "github" });
        user = created;
      }
    }

    // Re-read so the response always includes role and current profile data.
    const fresh = await findUserById(user.id);
    const token = signToken(fresh);
    res.json({ token, user: serializeUser(fresh) });
  } catch (err) {
    console.error("GitHub OAuth error:", err.message);
    res.status(500).json({ error: "GitHub sign-in failed" });
  }
});

export default router;
