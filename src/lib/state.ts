import { readFile, writeFile } from "node:fs/promises";

import type { BotState, DirectionState } from "./types.js";

const DEFAULT_DIRECTION_STATE = {
  status: "LIBRE" as const,
  lastAlertAt: null,
  lastDigestAt: null,
};

const DEFAULT_STATE: BotState = {
  sinceId: null,
  ida: { ...DEFAULT_DIRECTION_STATE },
  vuelta: { ...DEFAULT_DIRECTION_STATE },
};

const normalizeDirectionState = (
  raw: Partial<DirectionState> | undefined,
): DirectionState => ({
  status: raw?.status ?? "LIBRE",
  lastAlertAt: raw?.lastAlertAt ?? null,
  lastDigestAt: raw?.lastDigestAt ?? null,
});

export const loadState = async (statePath: URL): Promise<BotState> => {
  try {
    const raw = JSON.parse(await readFile(statePath, "utf-8")) as BotState & {
      lastDigestAt?: string | null;
    };

    const ida = normalizeDirectionState(raw.ida);
    const vuelta = normalizeDirectionState(raw.vuelta);

    // Migración: lastDigestAt global legacy → ida
    if (raw.lastDigestAt && !ida.lastDigestAt) {
      ida.lastDigestAt = raw.lastDigestAt;
    }

    return {
      sinceId: raw.sinceId ?? null,
      ida,
      vuelta,
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
};

export const saveState = async (
  statePath: URL,
  state: BotState,
): Promise<void> => {
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
};
