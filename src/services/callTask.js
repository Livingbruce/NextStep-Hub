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

const TASK = "INCOMING_CALL_TASK";

export const CALL_CHANNEL = "calls";
export const RING_MS = 45000;

export const callNotificationId = (id) => `call_${id}`;

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

    if (
      candidate &&
      typeof candidate === "object" &&
      candidate.type === "incoming_call" &&
      candidate.appointmentId
    ) {
      return candidate;
    }
  }

  return null;
}

async function showCall(payload) {
  if (!payload?.appointmentId) {
    throw new Error("Incoming call has no appointment ID.");
  }

  const channelId = await ensureChannel();

  await notifee.displayNotification({
    id: callNotificationId(payload.appointmentId),

    title: payload.callerName || "Your counselor",

    body: `Incoming ${payload.mode === "audio" ? "audio" : "video"} session · ${
      payload.sessionType || "Counseling"
    }`,

    data: {
      type: "incoming_call",
      appointmentId: String(payload.appointmentId),
      callerName: payload.callerName || "Your counselor",
      mode: payload.mode || "video",
      sessionType: payload.sessionType || "Counseling",
    },

    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,

      // Verify that this resource exists in your generated Android project.
      smallIcon: "ic_launcher",
      color: "#16A34A",

      ongoing: true,
      autoCancel: false,
      timeoutAfter: RING_MS,
      loopSound: true,

      pressAction: {
        id: "default",
        launchActivity: "default",
      },

      fullScreenAction: {
        id: "default",
        launchActivity: "default",
      },

      actions: [
        {
          title: "Decline",
          pressAction: { id: "decline" },
        },
        {
          title: "Accept",
          pressAction: {
            id: "accept",
            launchActivity: "default",
          },
        },
      ],
    },
  });

  console.log(
    "[IncomingCall] Native notification displayed:",
    payload.appointmentId,
  );
}

TaskManager.defineTask(TASK, async ({ data, error }) => {
  if (Platform.OS !== "android") return;

  if (error) {
    console.error("[IncomingCall] Background task error:", error);
    return;
  }

  try {
    const payload = parseIncomingPayload(data);

    if (!payload) {
      console.warn(
        "[IncomingCall] Could not parse incoming notification payload:",
        JSON.stringify(data),
      );
      return;
    }

    console.log("[IncomingCall] Received call:", payload.appointmentId);

    await showCall(payload);
  } catch (err) {
    console.error("[IncomingCall] Failed to display call:", err);
  }
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
  if (!Device.isDevice || !userId) return;

  let permission = await Notifications.getPermissionsAsync();

  if (permission.status !== "granted") {
    permission = await Notifications.requestPermissionsAsync();
  }

  if (permission.status !== "granted") {
    console.warn("[IncomingCall] Notification permission not granted.");
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    console.error("[IncomingCall] EAS project ID is missing.");
    return;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  const { error } = await supabase.from("push_tokens").upsert(
    {
      token,
      user_id: userId,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );

  if (error) {
    console.error("[IncomingCall] Push token save failed:", error);
  } else {
    console.log("[IncomingCall] Push token registered.");
  }
}
