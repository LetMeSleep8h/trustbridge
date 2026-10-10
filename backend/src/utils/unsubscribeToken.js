import crypto from "node:crypto";

/** HMAC token that proves an unsubscribe link was issued by us for this user. */
export function createUnsubscribeToken(secret, userId) {
  return crypto.createHmac("sha256", secret).update(`unsubscribe:${userId}`).digest("hex");
}

export function isValidUnsubscribeToken(secret, userId, token) {
  if (typeof token !== "string") return false;
  const expected = Buffer.from(createUnsubscribeToken(secret, userId));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
