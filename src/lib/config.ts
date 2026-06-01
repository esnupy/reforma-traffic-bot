const DEFAULT_SEARCH_QUERY =
  '(Metrobús OR Metrobus OR "Línea 1" OR "Línea 7") (Reforma OR "Paseo de la Reforma") (bloqueo OR manifestantes OR marcha OR cerrada OR afectado OR suspendido) -is:retweet lang:es';

export const getConfig = () => {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const xBearerToken = process.env.X_BEARER_TOKEN;

  if (!telegramBotToken || !telegramChatId || !xBearerToken) {
    throw new Error(
      "Faltan variables de entorno: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, X_BEARER_TOKEN",
    );
  }

  return {
    telegramBotToken,
    telegramChatId,
    xBearerToken,
    searchQuery: process.env.SEARCH_QUERY ?? DEFAULT_SEARCH_QUERY,
    jobForce: process.env.JOB_FORCE ?? "",
    jobDirection: process.env.JOB_DIRECTION ?? "auto",
    statePath: new URL("../../data/state.json", import.meta.url),
    alertCooldownMs: 20 * 60 * 1000,
    tweetMaxAgeMs: 2 * 60 * 60 * 1000,
  };
};

export type AppConfig = ReturnType<typeof getConfig>;
