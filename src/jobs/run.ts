import { getConfig } from "../lib/config.js";
import { loadState, saveState } from "../lib/state.js";
import { searchRecentTweets } from "../sources/x-search.js";
import { buildStatusMessage, evaluateStatus } from "../engine/status.js";
import { sendTelegramMessage } from "../notify/telegram.js";
import { resolveJobContext, shouldNotify } from "./context.js";

const main = async (): Promise<void> => {
  const config = getConfig();
  const context = resolveJobContext();

  if (!context) {
    console.log("Fuera de ventana activa. Job omitido.");
    return;
  }

  const state = await loadState(config.statePath);
  const directionState = state[context.direction];
  const search = await searchRecentTweets(config, state.sinceId);
  const result = evaluateStatus(
    search.tweets,
    context.direction,
    config.tweetMaxAgeMs,
  );

  if (search.newestId) {
    state.sinceId = search.newestId;
  }

  const notify = shouldNotify(
    context.mode,
    directionState.status,
    result.status,
    directionState.lastAlertAt,
    config.alertCooldownMs,
  );

  if (notify) {
    const message = buildStatusMessage(result, context.direction, context.mode);
    await sendTelegramMessage(
      config.telegramBotToken,
      config.telegramChatId,
      message,
    );

    directionState.lastAlertAt = new Date().toISOString();

    if (context.mode === "digest") {
      state.lastDigestAt = new Date().toISOString();
    }
  } else {
    console.log(
      `Sin cambios (${context.direction}: ${result.status}). Notificación omitida.`,
    );
  }

  directionState.status = result.status;
  await saveState(config.statePath, state);

  console.log(
    JSON.stringify({
      mode: context.mode,
      direction: context.direction,
      status: result.status,
      tweets: result.tweets.length,
      notified: notify,
    }),
  );
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
