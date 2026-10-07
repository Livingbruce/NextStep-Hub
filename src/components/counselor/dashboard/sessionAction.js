export const clientOf = (session) =>
  Array.isArray(session.client) ? session.client[0] : session.client;

export const clientNameOf = (session) => {
  const c = clientOf(session);
  return c
    ? `${c.first_name || ""} ${c.surname || ""}`.trim() || "Client"
    : "Client";
};

export const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "C";

// The number to call for a phone session.
export const phoneOf = (session) =>
  session.client_call_phone || clientOf(session)?.phone_no || "";

// What the main button on a session should do.
export const getAction = (session) => {
  if (session.session_mode === "phone") {
    return { kind: "call", label: "Call client", icon: "call" };
  }
  if (session.session_link?.trim()) {
    return { kind: "join", label: "Join session", icon: "videocam" };
  }
  return { kind: "link", label: "Add meeting link", icon: "link-outline" };
};

export const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const start = (x) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(d) - start(today)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};
