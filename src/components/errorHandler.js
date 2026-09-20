export const getFriendlyErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred. Please try again.";

  const message = error.message || "";
  const code = error.code || "";
  const status = error.status;

  // --- Network & Connection Errors ---
  if (
    message.includes("Failed to fetch") ||
    message.includes("Network request failed") ||
    code === "FETCH_ERROR"
  ) {
    return "Network connection issue. Please check your internet connection and try again.";
  }

  // --- Supabase Auth Error Cases ---
  if (
    message.includes("User already registered") ||
    code === "user_already_exists"
  ) {
    return "An account with this email already exists. Try logging in instead.";
  }

  if (
    message.includes("Password should be at least") ||
    code === "weak_password"
  ) {
    return "Your password is too weak. Please use at least 6 characters.";
  }

  if (
    message.includes("Unable to validate email address") ||
    code === "validation_failed"
  ) {
    return "Please enter a valid email address.";
  }

  if (status === 429 || message.includes("Email rate limit exceeded")) {
    return "Too many signup attempts in a short time. Please wait a few minutes and try again.";
  }

  if (code === "23505") {
    if (message.includes("username")) {
      return "That username is already taken. Please choose a different one.";
    }
    if (message.includes("phone")) {
      return "This phone number is already registered to another account.";
    }
    return "An account record with this detail already exists.";
  }

  // Foreign key constraint violation
  if (code === "23503") {
    return "Could not complete account setup due to invalid reference details.";
  }

  // Row-Level Security (RLS) violation
  if (code === "42501") {
    return "Account created, but server permissions prevented saving profile details. Please contact support.";
  }

  // Fallback for unexpected messages
  return (
    message || "Something went wrong during registration. Please try again."
  );
};
