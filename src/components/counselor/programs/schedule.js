const GRACE_MS = 30 * 60 * 1000;

export const fmtTimeOnly = (d) =>
  new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtDayShort = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const totalDays = (p) => Number(p?.total_days ?? p?.totalDays ?? 1) || 1;

export const getSlots = (p) => {
  const sch = Array.isArray(p?.schedule) ? p.schedule : [];
  const slots = sch
    .map((s) => ({ start: new Date(s.start), end: new Date(s.end) }))
    .filter((s) => !isNaN(s.start) && !isNaN(s.end))
    .sort((a, b) => a.start - b.start);
  if (slots.length) return slots;
  const start = new Date(p?.starts_at ?? p?.startsAt);
  const endRaw = p?.ends_at ?? p?.endsAt;
  const end = endRaw
    ? new Date(endRaw)
    : new Date(start.getTime() + 3 * 3600000);
  return [{ start, end }];
};

export const programEnd = (p) => {
  const slots = getSlots(p);
  return slots[slots.length - 1].end.getTime();
};

export const isProgramOver = (p, now = Date.now()) =>
  programEnd(p) + GRACE_MS < now;
