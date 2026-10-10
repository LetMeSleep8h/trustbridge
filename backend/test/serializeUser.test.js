import test from "node:test";
import assert from "node:assert/strict";
import { serializeUser } from "../src/utils/serializeUser.js";

const row = { id: 1, firstName: "Ada", lastName: "L", email: "a@b.co", password: "HASH", github_id: "42", created_at: "2026-01-01" };

test("never exposes the password hash or provider ids", () => {
  const out = serializeUser(row);
  assert.equal("password" in out, false);
  assert.equal("github_id" in out, false);
});

test("defaults role to user and keeps admin", () => {
  assert.equal(serializeUser(row).role, "user");
  assert.equal(serializeUser({ ...row, role: "admin" }).role, "admin");
});

test("defaults email notifications to on", () => {
  assert.equal(serializeUser(row).emailNotifications, 1);
});
