import test from "node:test";
import assert from "node:assert/strict";
import { createUnsubscribeToken, isValidUnsubscribeToken } from "../src/utils/unsubscribeToken.js";

const secret = "x".repeat(40);

test("accepts a token issued for the same user", () => {
  const token = createUnsubscribeToken(secret, 7);
  assert.equal(isValidUnsubscribeToken(secret, 7, token), true);
});

test("rejects a token issued for a different user", () => {
  const token = createUnsubscribeToken(secret, 7);
  assert.equal(isValidUnsubscribeToken(secret, 8, token), false);
});

test("rejects a token signed with a different secret", () => {
  const token = createUnsubscribeToken("y".repeat(40), 7);
  assert.equal(isValidUnsubscribeToken(secret, 7, token), false);
});

test("rejects missing or malformed tokens", () => {
  assert.equal(isValidUnsubscribeToken(secret, 7, undefined), false);
  assert.equal(isValidUnsubscribeToken(secret, 7, "short"), false);
});
