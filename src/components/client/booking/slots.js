export const DURATIONS = [
  { min: 30, caption: "Check-in" },
  { min: 40, caption: "Focused" },
  { min: 50, caption: "Standard" },
  { min: 60, caption: "Extended" },
];

export const MODES = [
  {
    value: "online",
    icon: "videocam-outline",
    title: "Online",
    text: "Video call. Your counselor adds the meeting link before the session.",
  },
  {
    value: "phone",
    icon: "call-outline",
    title: "Phone call",
    text: "Your counselor calls you on the number you give below.",
  },
];

// Working hours (local time): 8:00-13:00 and 14:00-17:00, Monday to Friday.
const WORK = {
  start: 8 * 60,
  lunchStart: 13 * 60,
  lunchEnd: 14 * 60,
  end: 17 * 60,
};
const STEP = 30;

const pad = (n) => String(n).padStart(2, "0");

export const toDateStr = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fmtTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

// 'YYYY-MM-DD' + minutes-from-midnight -> Date (local time)
export const atMinutes = (dateStr, mins) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, mins, 0, 0);
};

// scheduled_end_time = scheduled_start_time + duration
export const addMinutes = (date, mins) =>
  new Date(date.getTime() + mins * 60000);

// Next `count` weekdays starting today.
export const upcomingWeekdays = (count = 14) => {
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; out.length < count && i < 40; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(d);
  }
  return out;
};

// Every slot where the WHOLE session fits inside working hours and misses lunch.
export const buildSlots = (dateStr, duration, busy, now = new Date()) => {
  if (!dateStr) return [];
  const out = [];
  for (let s = WORK.start; s + duration <= WORK.end; s += STEP) {
    const e = s + duration;
    const fits = e <= WORK.lunchStart || s >= WORK.lunchEnd;
    if (!fits) continue;

    const start = atMinutes(dateStr, s);
    const end = atMinutes(dateStr, e);
    const past = start <= now;
    const taken = busy.some((b) => start < b.end && end > b.start);
    out.push({ start: s, label: fmtTime(s), available: !past && !taken });
  }
  return out;
};

export const validateKenyanPhone = (phone) => {
  if (!phone?.trim()) return "Enter the number we should call.";
  const clean = phone.replace(/[\s\-()]/g, "");
  return /^(?:(?:\+?254)|0)?([71]\d{8})$/.test(clean)
    ? null
    : "Use a Kenyan number starting with 07, 01 or +254.";
};
