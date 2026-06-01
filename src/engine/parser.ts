import type { Direction, ParsedTweet } from "../lib/types.js";

const BLOCK_KEYWORDS = [
  "bloqueo",
  "manifestantes",
  "marcha",
  "cerrada",
  "afectado",
  "suspendido",
  "sin servicio",
  "desvio",
  "desvío",
  "precaucionvial",
  "precauciónvial",
];

const METRO_REFORM_KEYWORDS = [
  "metrobús",
  "metrobus",
  "línea 1",
  "linea 1",
  "línea 7",
  "linea 7",
  "reforma",
  "paseo de la reforma",
];

const IDA_KEYWORDS = ["cuitláhuac", "cuitlahuac", "chapultepec"];
const VUELTA_KEYWORDS = ["diana", "lieja", "sevilla"];
const SHARED_SEGMENT_KEYWORDS = [
  "insurgentes",
  "río rhin",
  "rio rhin",
  "ángel",
  "angel",
  "insurgentes y reforma",
];

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

const includesAny = (text: string, keywords: string[]): boolean =>
  keywords.some((keyword) => text.includes(normalize(keyword)));

const isRecent = (tweet: ParsedTweet, maxAgeMs: number): boolean =>
  Date.now() - tweet.createdAt.getTime() <= maxAgeMs;

const matchesDirection = (text: string, direction: Direction): boolean => {
  const hasShared = includesAny(text, SHARED_SEGMENT_KEYWORDS);
  const hasIda = includesAny(text, IDA_KEYWORDS);
  const hasVuelta = includesAny(text, VUELTA_KEYWORDS);

  if (hasShared || (hasIda && hasVuelta)) {
    return true;
  }

  if (direction === "ida") {
    return hasIda || (!hasIda && !hasVuelta);
  }

  return hasVuelta || (!hasIda && !hasVuelta);
};

export const isRelevantTweet = (
  tweet: ParsedTweet,
  direction: Direction,
  maxAgeMs: number,
): boolean => {
  if (!isRecent(tweet, maxAgeMs)) {
    return false;
  }

  const text = normalize(tweet.text);
  const hasBlock = includesAny(text, BLOCK_KEYWORDS);
  const hasMetroReform = includesAny(text, METRO_REFORM_KEYWORDS);

  if (!hasBlock || !hasMetroReform) {
    return false;
  }

  return matchesDirection(text, direction);
};

export const filterRelevantTweets = (
  tweets: ParsedTweet[],
  direction: Direction,
  maxAgeMs: number,
): ParsedTweet[] =>
  tweets.filter((tweet) => isRelevantTweet(tweet, direction, maxAgeMs));
