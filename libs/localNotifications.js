import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PREFIX = "apt-";

const hasPermission = async () =>
  (await Notifications.getPermissionsAsync()).status === "granted";

export async function setupLocalNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
    });
  }
  if (!(await hasPermission())) {
    await Notifications.requestPermissionsAsync();
  }
}

// Pop-up right now
export async function showNotificationNow({ title, body, data }) {
  if (!(await hasPermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || "NextStep Hub",
      body: body || "",
      data: data || {},
    },
    trigger: Platform.OS === "android" ? { channelId: "default" } : null,
  });
}

export async function cancelAppointmentReminders() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// Schedules 24h + 1h reminders on the phone, so they fire even if the app is closed
export async function scheduleAppointmentReminders() {
  if (!(await hasPermission())) return;

  const now = Date.now();
  const { data: appts, error } = await supabase
    .from("appointments")
    .select("id, counseling_type, scheduled_start_time")
    .in("status", ["scheduled", "rescheduled"])
    .gt("scheduled_start_time", new Date(now).toISOString())
    .lte("scheduled_start_time", new Date(now + 7 * 86400000).toISOString());
  if (error) return;

  // Clear old ones first so cancelled/moved appointments don't still ring
  await cancelAppointmentReminders();

  const REMINDERS = [
    { key: "24h", ms: 24 * 3600000, title: "Appointment Tomorrow" },
    { key: "1h", ms: 3600000, title: "Appointment in 1 Hour" },
  ];

  for (const a of appts || []) {
    const start = new Date(a.scheduled_start_time).getTime();
    const when = new Date(start).toLocaleString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Nairobi",
    });

    for (const r of REMINDERS) {
      const at = start - r.ms;
      if (at <= now) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${a.id}-${r.key}`,
        content: {
          title: r.title,
          body: `Your ${a.counseling_type} session is on ${when}.`,
          data: { type: `appointment_reminder_${r.key}`, appointmentId: a.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(at),
          channelId: "default",
        },
      });
    }
  }
}
