import { filterRelevantTweets } from "./parser.js";
import type { Direction, ParsedTweet, RouteStatus, StatusResult } from "../lib/types.js";

export const evaluateStatus = (
  tweets: ParsedTweet[],
  direction: Direction,
  maxAgeMs: number,
): StatusResult => {
  const relevant = filterRelevantTweets(tweets, direction, maxAgeMs);

  return {
    status: relevant.length > 0 ? "NO_LIBRE" : "LIBRE",
    tweets: relevant.slice(0, 3),
  };
};

export const formatRelativeTime = (date: Date): string => {
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`;
  }

  const hours = Math.round(diffMinutes / 60);
  return `hace ${hours} h`;
};

export const formatMexicoCityTimestamp = (date: Date): string =>
  new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

export const buildStatusMessage = (
  result: StatusResult,
  direction: Direction,
  mode: "digest" | "poll" | "manual",
): string => {
  const directionLabel =
    direction === "ida" ? "ida (Cuitláhuac → Diana)" : "vuelta (Diana → Cuitláhuac)";
  const nowLabel = formatMexicoCityTimestamp(new Date());

  if (result.status === "LIBRE") {
    const digestLabel =
      mode === "digest"
        ? direction === "ida"
          ? "Resumen matutino"
          : "Resumen vespertino"
        : null;
    const prefix =
      digestLabel
        ? `✅ ${digestLabel}: Reforma LIBRE`
        : mode === "manual"
          ? "✅ Consulta manual: LIBRE"
          : "✅ Reforma sigue LIBRE";

    return `${prefix} — Metrobús sin bloqueos reportados en tu tramo (${directionLabel}).\n\nÚltima consulta: ${nowLabel}`;
  }

  const digestLabel =
    mode === "digest"
      ? direction === "ida"
        ? "Resumen matutino"
        : "Resumen vespertino"
      : null;
  const headline =
    digestLabel
      ? `🚫 ${digestLabel}: Reforma NO LIBRE`
      : mode === "manual"
        ? "🚫 Consulta manual: NO LIBRE"
        : "🚫 Alerta: Reforma NO LIBRE";

  const tweet = result.tweets[0];
  const tweetBlock = tweet
    ? `\n\n"${tweet.text}"\n👤 @${tweet.username} · ${formatRelativeTime(tweet.createdAt)}\n🔗 ${tweet.url}`
    : "";

  return `${headline} — posible afectación al Metrobús en tu tramo (${directionLabel}).${tweetBlock}\n\nÚltima consulta: ${nowLabel}`;
};
