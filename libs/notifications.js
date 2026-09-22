import { supabase } from "./supabase";

export const NOTIFICATION_TYPES = {
  NEW_APPOINTMENT: "new_appointment",
  APPOINTMENT_REMINDER_24H: "appointment_reminder_24h",
  APPOINTMENT_REMINDER_1H: "appointment_reminder_1h",
  LINK_UPDATED: "link_updated",
  COUNSELOR_SIGNUP: "counselor_signup",
  NEW_PROGRAM: "new_program",
  NEW_APPOINTMENT_ADMIN: "new_appointment_admin",
};

export async function createNotification({
  recipientId,
  type,
  title,
  body,
  data = {},
}) {
  if (!recipientId) return;
  const { error } = await supabase
    .from("notifications")
    .insert([{ recipient_id: recipientId, type, title, body, data }]);
  if (error) console.warn("createNotification error:", error.message);
}

export async function notifyAdmins({ type, title, body, data = {} }) {
  const { data: admins, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "Admin")
    .eq("approved", true);

  if (error || !admins?.length) return;

  const rows = admins.map((a) => ({
    recipient_id: a.id,
    type,
    title,
    body,
    data,
  }));
  await supabase.from("notifications").insert(rows);
}

export async function fetchNotifications(userId, limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("fetchNotifications error:", error.message);
    return [];
  }
  return data || [];
}

export async function markNotificationRead(id) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId) {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);
}

export function subscribeToNotifications(userId, onInsert) {
  if (!userId) return () => {};

  const channel = supabase.channel(`notifications-${userId}-${Date.now()}`).on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `recipient_id=eq.${userId}`,
    },
    (payload) => {
      onInsert(payload.new);
    },
  );

  let active = true;

  channel.subscribe((status) => {
    if (!active) return;

    if (status === "SUBSCRIBED") {
      console.log("Notifications realtime subscribed");
    }

    if (status === "CHANNEL_ERROR") {
      console.warn("Notifications realtime channel error");
    }

    if (status === "TIMED_OUT") {
      console.warn("Notifications realtime subscription timed out");
    }
  });

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
