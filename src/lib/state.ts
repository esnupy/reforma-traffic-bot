import { readFile, writeFile } from "node:fs/promises";

import type { BotState } from "./types.js";

const DEFAULT_STATE: BotState = {
  sinceId: null,
  ida: { status: "LIBRE", lastAlertAt: null },
  vuelta: { status: "LIBRE", lastAlertAt: null },
  lastDigestAt: null,
};

export const loadState = async (statePath: URL): Promise<BotState> => {
  try {
    const raw = await readFile(statePath, "utf-8");
    return { ...DEFAULT_STATE, ...JSON.parse(raw) } as BotState;
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
