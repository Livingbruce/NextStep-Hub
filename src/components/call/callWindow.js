// REMINDER: Keep EARLY/LATE in sync with the edge function.
export const EARLY_MS = 15 * 60 * 1000;
export const LATE_MS = 60 * 60 * 1000;

export function opensIn(ms) {
  const m = Math.max(1, Math.ceil(ms / 60000));
  if (m >= 1440) return `${Math.round(m / 1440)} d`;
  if (m >= 60) return `${Math.floor(m / 60)} h ${m % 60} min`;
  return `${m} min`;
}

// state: open | early | expired | payment
export function joinState(session, now) {
  const start = new Date(session.scheduled_start_time).getTime();
  const end = new Date(session.scheduled_end_time || start + 3600000).getTime();
  if (session.status === "pending_payment")
    return { state: "payment", label: "Awaiting payment" };
  if (now < start - EARLY_MS)
    return {
      state: "early",
      label: `Opens in ${opensIn(start - EARLY_MS - now)}`,
    };
  if (now > end + LATE_MS) return { state: "expired", label: "Window closed" };
  return {
    state: "open",
    label: now < start ? "Ready to start" : "In session window",
  };
}

// Client view: can only enter once the counselor is live.
export function clientJoinState(apt, now, live) {
  const base = joinState(apt, now);
  if (base.state !== "open") return base;
  if (live) return { state: "live", label: "Join now" };
  if (apt.session_mode === "phone")
    return { state: "phone", label: "Counselor will call you" };
  return { state: "waiting", label: "Waiting for counselor" };
}
