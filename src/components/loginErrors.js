export const SUPPORT_EMAIL = "support@nextstep.org";

// Thrown by the login screen when auth succeeds but no profile row exists.
export const PROFILE_MISSING = "PROFILE_MISSING";

export function getLoginError(error) {
  if (!error) {
    return { message: "Something went wrong. Please try again." };
  }

  const msg = String(error.message || "").toLowerCase();
  const code = String(error.code || "");
  const status = error.status;

  if (
    error.name === PROFILE_MISSING ||
    code === "PGRST116" ||
    msg.includes("cannot coerce the result")
  ) {
    return {
      message:
        "We couldn't find your account details. Your sign-up may not have finished. Please create your account again, or contact support if you think this is a mistake.",
      action: "signup",
    };
  }

  // No internet / server unreachable
  if (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("connection") ||
    status === 0
  ) {
    return {
      message:
        "We can't reach the server right now. Check your internet connection and try again.",
    };
  }

  if (
    msg.includes("invalid login credentials") ||
    code === "invalid_credentials"
  ) {
    return {
      message:
        "That email and password don't match an account. Check for typos, or create an account if you're new here.",
      action: "signup",
    };
  }

  if (msg.includes("email not confirmed") || code === "email_not_confirmed") {
    return {
      message:
        "Please confirm your email first. We sent you a verification link, so check your inbox and spam folder.",
    };
  }

  if (
    status === 429 ||
    msg.includes("too many requests") ||
    code === "over_request_rate_limit"
  ) {
    return {
      message:
        "Too many attempts in a short time. Please wait a minute and try again.",
    };
  }

  if (msg.includes("banned") || code === "user_banned") {
    return {
      message: `This account has been disabled. Please contact ${SUPPORT_EMAIL}.`,
      action: "support",
    };
  }

  // Row-level-security / permissions
  if (code === "42501") {
    return {
      message: `We couldn't load your account. Please try again, or contact ${SUPPORT_EMAIL} if it keeps happening.`,
      action: "support",
    };
  }

  if (typeof status === "number" && status >= 500) {
    return {
      message:
        "Our servers are having a moment. Please try again in a little while.",
    };
  }

  return {
    message: `Something went wrong while signing you in. Please try again, or contact ${SUPPORT_EMAIL} if it continues.`,
    action: "support",
  };
}
