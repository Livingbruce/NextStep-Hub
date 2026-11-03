import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from "@notifee/react-native";

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { supabase } from "../../libs/supabase";
import {
  canDrawOverlays,
  isLocked,
  showCallOverlay,
} from "../../modules/call-overlay";

const TASK = "INCOMING_CALL_TASK";

export const CALL_CHANNEL = "incomimg_calls_v2";
export const RING_MS = 45000;

export const callNotificationId = (id) => `call_${id}`;
export const QUIET_CHANNEL = "calls_quiet";

export const respondToCall = (appointmentId, response) =>
  supabase.rpc("respond_to_call", {
    p_appointment_id: appointmentId,
    p_response: response,
  });

async function ensureChannel() {
  return notifee.createChannel({
    id: CALL_CHANNEL,
    name: "Incoming calls",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: "default",
    vibration: true,
  });
}

async function ensureQuietChannel() {
  return notifee.createChannel({
    id: QUIET_CHANNEL,
    name: "Incoming calls (ringing)",
    importance: AndroidImportance.DEFAULT,
    sound: "default",
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
  });
}

function parseIncomingPayload(taskData) {
  const candidates = [
    taskData?.notification?.request?.content?.data,
    taskData?.request?.content?.data,
    taskData?.data?.notification?.request?.content?.data,
    taskData?.data?.request?.content?.data,
    taskData?.data?.dataString,
    taskData?.dataString,
    taskData?.data?.data,
    taskData?.data,
    taskData,
  ];

  for (let candidate of candidates) {
    if (typeof candidate === "string") {
      try {
        candidate = JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    if (!candidate || typeof candidate !== "object") continue;

    if (candidate.type === "session_live") {
      return null;
    }

    if (candidate.type === "incoming_call" && candidate.appointmentId) {
      return candidate;
    }
  }

  return null;
}

export async function showCall(payload, { quiet = false } = {}) {
  if (!payload?.appointmentId)
    throw new Error("Incoming call has no appointment ID.");
  const channelId = quiet ? await ensureQuietChannel() : await ensureChannel();

  await notifee.displayNotification({
    id: callNotificationId(payload.appointmentId),
    title: payload.callerName || "Your counselor",
    body: `Incoming ${payload.mode === "audio" ? "audio" : "video"} session · ${payload.sessionType || "Counseling"}`,
    data: {
      /* unchanged */
    },
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: quiet ? AndroidImportance.DEFAULT : AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: "notification_icon",
      color: "#16A34A",
      ongoing: true,
      autoCancel: false,
      timeoutAfter: RING_MS,
      loopSound: true,
      pressAction: { id: "default", launchActivity: "default" },
      ...(quiet
        ? {}
        : { fullScreenAction: { id: "default", launchActivity: "default" } }),
      actions: [
        { title: "Decline", pressAction: { id: "decline" } },
        {
          title: "Accept",
          pressAction: { id: "accept", launchActivity: "default" },
        },
      ],
    },
  });
}

TaskManager.defineTask(TASK, async ({ data, error }) => {
  if (Platform.OS !== "android" || error) return;
  const payload = parseIncomingPayload(data);
  if (!payload) return;
  if (AppState.currentState === "active") return;

  const useOverlay = canDrawOverlays() && !isLocked();
  if (useOverlay) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      showCallOverlay({
        appointmentId: String(payload.appointmentId),
        name: payload.callerName || "Your counselor",
        mode: payload.mode || "video",
        type: payload.sessionType || "Counseling",
        scheme: "nextstephub",
        channelId: QUIET_CHANNEL,
        timeoutMs: RING_MS,
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        accessToken: session?.access_token,
      });
      await showCall(payload, { quiet: true });
      return;
    } catch (e) {
      console.error("[IncomingCall] Overlay failed, using notification:", e);
    }
  }
  await showCall(payload);
});

// Register the background task during module initialization.
Notifications.registerTaskAsync(TASK).catch((err) => {
  console.error("[IncomingCall] Task registration failed:", err);
});

// Register exactly one Notifee background event handler.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  try {
    const appointmentId = detail?.notification?.data?.appointmentId;

    if (!appointmentId || type !== EventType.ACTION_PRESS) {
      return;
    }

    const action = detail.pressAction?.id;

    if (action !== "accept" && action !== "decline") {
      return;
    }

    if (action === "decline") {
      const { error } = await respondToCall(appointmentId, "declined");

      if (error) {
        console.error("[IncomingCall] Decline failed:", error);
        return;
      }

      await notifee.cancelNotification(callNotificationId(appointmentId));
    }

    // Accept launches the app.
  } catch (err) {
    console.error("[IncomingCall] Notification action failed:", err);
  }
});

export async function registerPushToken(userId) {
  console.log("[PushRegistration] Starting", {
    userId,
    isPhysicalDevice: Device.isDevice,
    platform: Platform.OS,
  });

  if (!Device.isDevice) {
    console.warn("[PushRegistration] Not a physical device.");
    return;
  }

  if (!userId) {
    console.warn("[PushRegistration] Missing user ID.");
    return;
  }

  try {
    let permission = await Notifications.getPermissionsAsync();

    console.log("[PushRegistration] Current permission:", permission);

    if (permission.status !== "granted") {
      permission = await Notifications.requestPermissionsAsync();
    }

    if (permission.status !== "granted") {
      console.warn("[PushRegistration] Permission denied:", permission.status);
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    console.log("[PushRegistration] EAS project ID:", projectId);

    if (!projectId) {
      console.error("[PushRegistration] Missing EAS project ID.");
      return;
    }

    const result = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = result.data;

    console.log("[PushRegistration] Expo token received:", token);

    if (!token) {
      console.error("[PushRegistration] Expo returned an empty token.");
      return;
    }

    const { data, error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          token,
          user_id: userId,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" },
      )
      .select();

    if (error) {
      console.error("[PushRegistration] Push token save failed:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return;
    }

    console.log("[PushRegistration] Token saved successfully:", data);
  } catch (error) {
    console.error("[PushRegistration] Registration failed:", error);
  }
}
