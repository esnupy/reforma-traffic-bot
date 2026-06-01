import type { AppConfig } from "../lib/config.js";
import type { ParsedTweet } from "../lib/types.js";

interface XUser {
  id: string;
  username: string;
}

interface XTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
}

interface XSearchResponse {
  data?: XTweet[];
  includes?: { users?: XUser[] };
  meta?: { newest_id?: string; result_count?: number };
}

export interface XSearchResult {
  tweets: ParsedTweet[];
  newestId: string | null;
}

export const searchRecentTweets = async (
  config: AppConfig,
  sinceId: string | null,
): Promise<XSearchResult> => {
  const params = new URLSearchParams({
    query: config.searchQuery,
    max_results: "100",
    "tweet.fields": "created_at,author_id",
    expansions: "author_id",
    "user.fields": "username",
  });

  if (sinceId) {
    params.set("since_id", sinceId);
  }

  const response = await fetch(
    `https://api.x.com/2/tweets/search/recent?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${config.xBearerToken}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X API error ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as XSearchResponse;
  const users = new Map(
    (payload.includes?.users ?? []).map((user) => [user.id, user.username]),
  );

  const tweets: ParsedTweet[] = (payload.data ?? []).map((tweet) => {
    const username = users.get(tweet.author_id) ?? "unknown";
    return {
      id: tweet.id,
      text: tweet.text,
      username,
      createdAt: new Date(tweet.created_at),
      url: `https://x.com/${username}/status/${tweet.id}`,
    };
  });

  return {
    tweets,
    newestId: payload.meta?.newest_id ?? tweets[0]?.id ?? sinceId,
  };
};
