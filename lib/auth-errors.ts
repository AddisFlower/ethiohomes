export function getFriendlyAuthError(rawError: string, fallback: string) {
  const normalized = rawError.toLowerCase();

  if (
    normalized.includes("invalid_credentials") ||
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "Invalid email or password. Please try again.";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user_already_exists") ||
    normalized.includes("email_exists")
  ) {
    return "An account with this email already exists.";
  }

  if (
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("rate limit")
  ) {
    return "Too many email requests. Please wait a moment and try again.";
  }

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed")
  ) {
    return "Please confirm your email before signing in.";
  }

  if (
    normalized.includes("token") ||
    normalized.includes("expired") ||
    normalized.includes("invalid jwt")
  ) {
    return "This reset link is invalid or expired. Please request a new one.";
  }

  return fallback;
}

export function logAuthError(context: string, rawError: string) {
  console.error(`[auth] ${context}`, rawError);
}
