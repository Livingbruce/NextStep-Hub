const BRAND = "#F05A2B";
const APP = "NextStep Hub";
const SUPPORT = "support@nextstep.org";

const esc = (v = "") =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const formatWhen = (iso) =>
  new Date(iso).toLocaleString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });

const layout = (title, bodyHtml) => `
<div style="background:#F8FAFC;padding:24px;font-family:Arial,sans-serif;color:#0F172A">
  <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden">
    <div style="background:${BRAND};padding:18px 24px;color:#fff;font-size:20px;font-weight:800">${APP}</div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;font-size:20px">${esc(title)}</h2>
      ${bodyHtml}
    </div>
    <div style="padding:16px 24px;background:#F1F5F9;font-size:12px;color:#64748B">
      Questions? Contact <a href="mailto:${SUPPORT}" style="color:${BRAND}">${SUPPORT}</a>.<br/>
      ${APP} is not an emergency service. If you are in danger, contact your local emergency services.
    </div>
  </div>
</div>`;

const row = (label, value) =>
  `<tr><td style="padding:6px 12px 6px 0;color:#64748B">${esc(label)}</td><td style="padding:6px 0;font-weight:600">${esc(value)}</td></tr>`;

const p = (t) => `<p style="line-height:1.6;margin:0 0 12px">${t}</p>`;

/* ---------------- Templates ---------------- */

export const welcomeEmail = ({ firstName, role }) => {
  const isClient = role === "Client";
  return {
    subject: `Welcome to ${APP}, ${firstName}!`,
    text: isClient
      ? `Welcome ${firstName}! Your account is ready. Sign in to book your first session.`
      : `Thanks ${firstName}! Your ${role} account was created and is pending admin approval.`,
    html: layout(
      `Welcome, ${firstName}!`,
      isClient
        ? p(
            "Your account is ready. Sign in to explore our guidance programs and book your first session.",
          )
        : p(
            `Your <b>${esc(role)}</b> account has been created. An administrator will review it, and you'll get full access once approved. You can sign in anytime to check your status.`,
          ),
    ),
  };
};

export const staffInviteEmail = ({ role }) => ({
  subject: `You've been invited to join ${APP} as a ${role}`,
  text: `You have been invited to join ${APP} as a ${role}. Download the app and sign up using this email address.`,
  html: layout(
    "You've been invited",
    p(`You have been invited to join <b>${APP}</b> as a <b>${esc(role)}</b>.`) +
      p(
        "To get started, open the app and <b>sign up using this same email address</b>. Your account will then be reviewed and approved by an administrator.",
      ) +
      p(
        "If you weren't expecting this invitation, you can safely ignore this email.",
      ),
  ),
});

export const clientBookingEmail = ({
  clientName,
  counselorName,
  counselingType,
  startTime,
  paid,
}) => ({
  subject: "Your appointment has been booked",
  text: `Hi ${clientName}, your ${counselingType} session with ${counselorName} is booked for ${formatWhen(startTime)}.`,
  html: layout(
    "Appointment booked",
    p(`Hi ${esc(clientName)}, your session has been booked.`) +
      `<table>${row("Counselor", counselorName)}${row("Type", counselingType)}${row("When", formatWhen(startTime))}${row("Payment", paid ? "Paid" : "Pending")}</table>` +
      p(
        "Your counselor will add the virtual meeting link, and you'll be notified when it's ready.",
      ),
  ),
});

export const counselorBookingEmail = ({
  counselorName,
  clientName,
  counselingType,
  startTime,
}) => ({
  subject: "New appointment booked with you",
  text: `Hi ${counselorName}, ${clientName} booked a ${counselingType} session for ${formatWhen(startTime)}.`,
  html: layout(
    "New appointment",
    p(`Hi ${esc(counselorName)}, a client has booked a session with you.`) +
      `<table>${row("Client", clientName)}${row("Type", counselingType)}${row("When", formatWhen(startTime))}</table>` +
      p("Open the app to view intake details and add the meeting link."),
  ),
});

export const reminderEmail = ({
  recipientName,
  otherName,
  counselingType,
  startTime,
  link,
}) => ({
  subject: "Reminder: your session starts in 1 hour",
  text: `Hi ${recipientName}, your ${counselingType} session with ${otherName} starts at ${formatWhen(startTime)}.${link ? " Join: " + link : ""}`,
  html: layout(
    "Your session starts soon",
    p(
      `Hi ${esc(recipientName)}, this is a reminder that your session starts in about <b>1 hour</b>.`,
    ) +
      `<table>${row("With", otherName)}${row("Type", counselingType)}${row("When", formatWhen(startTime))}</table>` +
      (link
        ? `<p><a href="${esc(link)}" style="display:inline-block;background:${BRAND};color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Join session</a></p>`
        : p("No meeting link has been added yet. Please check the app.")),
  ),
});

export const loginAlertEmail = ({ firstName, device, time }) => ({
  subject: `New login to your ${APP} account`,
  text: `Hi ${firstName}, a new login to your account was detected on ${device} at ${time}. If this wasn't you, change your password and contact ${SUPPORT}.`,
  html: layout(
    "New login detected",
    p(`Hi ${esc(firstName)}, we noticed a new sign-in to your account.`) +
      `<table>${row("Device", device)}${row("Time", time)}</table>` +
      p(
        `If this was you, no action is needed. If not, please <b>reset your password</b> and contact <a href="mailto:${SUPPORT}">${SUPPORT}</a> immediately.`,
      ),
  ),
});
