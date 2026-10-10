const MIN_SECRET_LENGTH = 32;

/**
 * The secret used to sign JWTs and unsubscribe links.
 * Production refuses to start without a strong JWT_SECRET; development falls
 * back to an obviously insecure value and warns.
 */
function resolveSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= MIN_SECRET_LENGTH) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters in production`);
  }
  console.warn("[auth] JWT_SECRET is missing or too short. Using an insecure development-only secret.");
  return "development-only-insecure-secret-do-not-use-in-production";
}

export const SIGNING_SECRET = resolveSecret();
