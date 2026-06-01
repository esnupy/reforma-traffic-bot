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

/** Digest: ~7:45 AM CDMX */
const isDigestWindow = (parts: MexicoParts): boolean =>
  parts.hour === 7 && parts.minute >= 43 && parts.minute <= 47;

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
    return { mode: "digest", direction: "ida" };
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

  if (isDigestWindow(parts)) {
    return { mode: "digest", direction: "ida" };
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
