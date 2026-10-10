/**
 * Shape a user row for API responses. Never include the password hash or
 * provider identifiers here. Shared by the auth and OAuth routes so every
 * login path returns the same fields (including `role`).
 */
export function serializeUser(user) {
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
