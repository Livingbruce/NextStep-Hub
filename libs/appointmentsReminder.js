import { createNotification, NOTIFICATION_TYPES } from "./notifications";
import { supabase } from "./supabase";

// Call on dashboard mount/focus for both client and counselor.
export async function checkAppointmentReminders() {
  try {
    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        "id, client_id, counselor_id, scheduled_start_time, counseling_type, reminder_24h_sent, reminder_1h_sent",
      )
      .in("status", ["scheduled", "rescheduled"])
      .gte("scheduled_start_time", now.toISOString())
      .lte("scheduled_start_time", in24h.toISOString());

    if (error || !appointments?.length) return;

    for (const apt of appointments) {
      const start = new Date(apt.scheduled_start_time);

      if (!apt.reminder_24h_sent && start <= in24h) {
        await createNotification({
          recipientId: apt.client_id,
          type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H,
          title: "Appointment Tomorrow",
          body: `Your ${apt.counseling_type} session is coming up in about a day.`,
          data: { appointmentId: apt.id },
        });
        await createNotification({
          recipientId: apt.counselor_id,
          type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H,
          title: "Appointment Tomorrow",
          body: `You have a ${apt.counseling_type} session in about a day.`,
          data: { appointmentId: apt.id },
        });
        await supabase
          .from("appointments")
          .update({ reminder_24h_sent: true })
          .eq("id", apt.id);
      }

      if (!apt.reminder_1h_sent && start <= in1h) {
        await createNotification({
          recipientId: apt.client_id,
          type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H,
          title: "Appointment in 1 Hour",
          body: `Your ${apt.counseling_type} session starts soon.`,
          data: { appointmentId: apt.id },
        });
        await createNotification({
          recipientId: apt.counselor_id,
          type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H,
          title: "Appointment in 1 Hour",
          body: `Your ${apt.counseling_type} session starts soon.`,
          data: { appointmentId: apt.id },
        });
        await supabase
          .from("appointments")
          .update({ reminder_1h_sent: true })
          .eq("id", apt.id);
      }
    }
  } catch (err) {
    console.warn("checkAppointmentReminders error:", err);
  }
}
