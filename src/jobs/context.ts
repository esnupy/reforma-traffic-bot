import type { Direction, JobContext, JobMode } from "../lib/types.js";

const MEXICO_TZ = "America/Mexico_City";

interface MexicoParts {
  weekday: number;
  hour: number;
  minute: number;
}

const getMexicoCityParts = (date = new Date()): MexicoParts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TZ,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const weekdayLabel = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return {
    weekday: weekdayMap[weekdayLabel] ?? 1,
    hour,
    minute,
  };
};

const isWeekday = (weekday: number): boolean => weekday >= 1 && weekday <= 5;

const toMinutes = (parts: MexicoParts): number => parts.hour * 60 + parts.minute;

/** Ida: 6:00–8:00 AM CDMX inclusive */
const isIdaWindow = (parts: MexicoParts): boolean => {
  const minutes = toMinutes(parts);
  return minutes >= 6 * 60 && minutes <= 8 * 60;
};

/** Vuelta: 4:00–6:00 PM CDMX inclusive */
const isVueltaWindow = (parts: MexicoParts): boolean => {
  const minutes = toMinutes(parts);
  return minutes >= 16 * 60 && minutes <= 18 * 60;
};

/** Digest matutino ida: ~7:45 AM CDMX (ventana amplia por delays de GitHub Actions) */
const isIdaDigestWindow = (parts: MexicoParts): boolean => {
  const minutes = toMinutes(parts);
  return minutes >= 7 * 60 + 40 && minutes <= 7 * 60 + 55;
};

/** Digest vespertino vuelta: ~4:45 PM CDMX */
const isVueltaDigestWindow = (parts: MexicoParts): boolean => {
  const minutes = toMinutes(parts);
  return minutes >= 16 * 60 + 40 && minutes <= 16 * 60 + 55;
};

/** Evita enviar el digest más de una vez el mismo día (hora CDMX). */
export const wasDigestSentToday = (lastDigestAt: string | null): boolean => {
  if (!lastDigestAt) {
    return false;
  }

  const dateKey = (date: Date): string =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: MEXICO_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

  return dateKey(new Date(lastDigestAt)) === dateKey(new Date());
};

const resolveDirection = (
  input: string,
  parts: MexicoParts,
): Direction | null => {
  if (input === "ida" || input === "vuelta") {
    return input;
  }

  if (isIdaWindow(parts)) {
    return "ida";
  }

  if (isVueltaWindow(parts)) {
    return "vuelta";
  }

  return "ida";
};

export const resolveJobContext = (): JobContext | null => {
  const force = process.env.JOB_FORCE ?? "";
  const directionInput = process.env.JOB_DIRECTION ?? "auto";
  const parts = getMexicoCityParts();
  const isManualDispatch = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";

  if (force === "digest") {
    const direction: Direction =
      directionInput === "vuelta" ? "vuelta" : "ida";
    return { mode: "digest", direction };
  }

  if (isManualDispatch) {
    const direction = resolveDirection(directionInput, parts);
    if (!direction) {
      return null;
    }

    if (force === "poll") {
      return { mode: "poll", direction };
    }

    return { mode: "manual", direction };
  }

  if (!isWeekday(parts.weekday)) {
    return null;
  }

  if (isIdaDigestWindow(parts)) {
    return { mode: "digest", direction: "ida" };
  }

  if (isVueltaDigestWindow(parts)) {
    return { mode: "digest", direction: "vuelta" };
  }

  if (isIdaWindow(parts)) {
    return { mode: "poll", direction: "ida" };
  }

  if (isVueltaWindow(parts)) {
    return { mode: "poll", direction: "vuelta" };
  }

  return null;
};

export const shouldNotify = (
  mode: JobMode,
  previousStatus: string,
  nextStatus: string,
  lastAlertAt: string | null,
  cooldownMs: number,
): boolean => {
  if (mode === "digest" || mode === "manual") {
    return true;
  }

  if (previousStatus === nextStatus) {
    return false;
  }

  if (lastAlertAt) {
    const elapsed = Date.now() - new Date(lastAlertAt).getTime();
    if (elapsed < cooldownMs) {
      return false;
    }
  }

  return true;
};
