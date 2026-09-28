import { useEffect, useState } from "react";

export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatWhen(iso) {
  if (!iso) return "To be scheduled";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// "In 25 min", "In 3 hrs", "Tomorrow", "In 4 days", "Happening now"
export function relativeLabel(iso, now) {
  if (!iso) return "";
  const date = new Date(iso);
  const mins = Math.round((date.getTime() - now) / 60000);
  if (mins <= 0 && mins > -90) return "Happening now";
  if (mins <= -90) return "Started";
  if (mins < 60) return `In ${mins} min`;
  const days = Math.round(
    (startOfDay(date) - startOfDay(new Date(now))) / 86400000,
  );
  if (days === 0) {
    const hrs = Math.round(mins / 60);
    return `In ${hrs} ${hrs === 1 ? "hr" : "hrs"}`;
  }
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function isSoon(iso, now) {
  if (!iso) return false;
  const mins = Math.round((new Date(iso).getTime() - now) / 60000);
  return mins <= 15 && mins > -90;
}

export const STATUS_META = {
  scheduled: { label: "Confirmed", bg: "#DCFCE7", text: "#15803D" },
  rescheduled: { label: "Rescheduled", bg: "#E0F2FE", text: "#0369A1" },
  rescheduled_requested: {
    label: "Reschedule requested",
    bg: "#E0F2FE",
    text: "#0369A1",
  },
  pending_payment: {
    label: "Awaiting payment",
    bg: "#FEF3C7",
    text: "#B45309",
  },
};

export const statusMeta = (status) =>
  STATUS_META[status?.toLowerCase()] || {
    label: (status || "Pending").replace(/_/g, " "),
    bg: "#F1F5F9",
    text: "#475569",
  };
