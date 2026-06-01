export type RouteStatus = "LIBRE" | "NO_LIBRE";

export type Direction = "ida" | "vuelta";

export type JobMode = "digest" | "poll" | "manual";

export interface DirectionState {
  status: RouteStatus;
  lastAlertAt: string | null;
}

export interface BotState {
  sinceId: string | null;
  ida: DirectionState;
  vuelta: DirectionState;
  lastDigestAt: string | null;
}

export interface ParsedTweet {
  id: string;
  text: string;
  username: string;
  createdAt: Date;
  url: string;
}

export interface JobContext {
  mode: JobMode;
  direction: Direction;
}

export interface StatusResult {
  status: RouteStatus;
  tweets: ParsedTweet[];
}
