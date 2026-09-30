import { Platform } from "react-native";

const LOCAL_HOST_IP = "192.168.137.1";

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "android") {
      return `http://${LOCAL_HOST_IP}:5000`;
    }

    return "http://localhost:5000";
  }

  return "https://your-production-email-server.com";
};

const BASE_URL = getBaseUrl().trim();
const API_SECRET_KEY = "nextstepmentorshub";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log("Email API URL:", `${BASE_URL}/send-email`);

    const response = await fetch(`${BASE_URL}/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_SECRET_KEY,
      },
      body: JSON.stringify({ to, subject, text, html }),
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(
        `Server returned non-JSON response (${response.status}): ${rawText.slice(0, 100)}`,
      );
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to send email");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email Dispatch Error:", error.message);
    return { success: false, error: error.message };
  }
};
