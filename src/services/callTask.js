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
import { AppState, Platform } from "react-native";
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

async function showCall(p) {
  const channelId = await ensureChannel();
  await notifee.displayNotification({
    id: callNotificationId(p.appointmentId),
    title: p.callerName || "Your counselor",
    body: `Incoming ${p.mode} session · ${p.sessionType || "Counseling"}`,
    data: { appointmentId: p.appointmentId },
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: "ic_launcher",
      color: "#16A34A",
      ongoing: true,
      autoCancel: false,
      timeoutAfter: RING_MS,
      loopSound: true,
      pressAction: { id: "default", launchActivity: "default" },
      fullScreenAction: { id: "default", launchActivity: "default" },
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

// The payload shape differs slightly between SDK versions, so parse defensively.
function parse(taskData) {
  let raw =
    taskData?.data?.dataString ??
    taskData?.dataString ??
    taskData?.data ??
    taskData;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw?.type ? raw : null;
}

TaskManager.defineTask(TASK, async ({ data, error }) => {
  if (error || Platform.OS !== "android") return;
  const p = parse(data);
  // When the app is open, the realtime screen handles it.
  if (p?.type === "incoming_call" && AppState.currentState !== "active")
    await showCall(p);
});
Notifications.registerTaskAsync(TASK).catch(() => {});

// Decline straight from the notification without opening the app.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const id = detail.notification?.data?.appointmentId;
  if (
    type === EventType.ACTION_PRESS &&
    detail.pressAction?.id === "decline" &&
    id
  ) {
    await respondToCall(id, "declined");
    await notifee.cancelNotification(callNotificationId(id));
  }
});

export async function registerPushToken(userId) {
  if (!Device.isDevice || !userId) return;
  let perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted")
    perm = await Notifications.requestPermissionsAsync();
  if (perm.status !== "granted") return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  await supabase
    .from("push_tokens")
    .upsert(
      {
        token,
        user_id: userId,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
}
