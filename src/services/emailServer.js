import { supabase } from "../../libs/supabase";

const ENDPOINTS = [process.env.EXPO_PUBLIC_EMAIL_SERVICE_URL]
  .map((u) => (u || "").trim())
  .filter(Boolean);

const API_KEY = process.env.EXPO_PUBLIC_API_SECRET_KEY;
const TIMEOUT_MS = [30000];

async function postWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!ENDPOINTS.length) {
    return { success: false, error: "No email service URL configured" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  if (API_KEY) headers["x-api-key"] = API_KEY;

  const body = JSON.stringify({ to, subject, text, html });
  let lastError = "Failed to send email";

  for (let i = 0; i < ENDPOINTS.length; i++) {
    const url = ENDPOINTS[i];
    try {
      const response = await postWithTimeout(
        url,
        { method: "POST", headers, body },
        TIMEOUT_MS[i] ?? 30000,
      );

      const raw = await response.text();
      let data = {};
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Non-JSON response (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `HTTP ${response.status}`,
        );
      }

      return { success: true, data, via: url };
    } catch (err) {
      lastError = err.name === "AbortError" ? "Request timed out" : err.message;
      console.warn(`Email via ${url} failed: ${lastError}`);
    }
  }

  console.error("All email endpoints failed:", lastError);
  return { success: false, error: lastError };
};
