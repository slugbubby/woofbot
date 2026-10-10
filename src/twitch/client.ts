import { ApiClient } from "@twurple/api";
import type { AccessToken } from "@twurple/auth";
import { RefreshingAuthProvider } from "@twurple/auth";
import { EventSubWsListener } from "@twurple/eventsub-ws";
import { desc } from "drizzle-orm";

import { db } from "../db/index.js";
import { twitchTokens, type NewTwitchToken } from "../db/schema.js";
import { handleChatMessage } from "./commands.js";

type TwitchConfig = {
  clientId: string;
  clientSecret: string;
  channel: string;
  redirectUri: string;
  authSecret: string;
};

type TwitchBot = {
  apiClient: ApiClient;
  listener: EventSubWsListener;
  twitchId: string;
  broadcasterId: string;
};

let bot: TwitchBot | null = null;

export function getTwitchConfig(): TwitchConfig | null {
  const {
    TWITCH_CLIENT_ID: clientId,
    TWITCH_CLIENT_SECRET: clientSecret,
    TWITCH_CHANNEL: channel,
    TWITCH_REDIRECT_URI: redirectUri,
    TWITCH_AUTH_SECRET: authSecret,
  } = process.env;

  if (!clientId || !clientSecret || !channel || !redirectUri || !authSecret) {
    return null;
  }
  return { clientId, clientSecret, channel, redirectUri, authSecret };
}

async function getBotToken(): Promise<{
  twitchId: string;
  token: AccessToken;
} | null> {
  // TODO filter this to only get token for bot twitchID
  const [row] = await db
    .select()
    .from(twitchTokens)
    .orderBy(desc(twitchTokens.updatedAt))
    .limit(1);
  if (!row) {
    return null;
  }

  const token: AccessToken = {
    accessToken: row.accessToken,
    refreshToken: row.refreshToken ?? null,
    scope: row.scope,
    expiresIn: row.expiresIn ?? null,
    obtainmentTimestamp: row.obtainmentTimestamp,
  };
  return { twitchId: row.twitchId, token };
}

export async function saveTwitchToken(
  twitchId: string,
  token: AccessToken,
): Promise<void> {
  const tokenValues: Omit<NewTwitchToken, "twitchId"> = {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? null,
    scope: token.scope,
    expiresIn: token.expiresIn ?? null,
    obtainmentTimestamp: token.obtainmentTimestamp,
  };

  await db
    .insert(twitchTokens)
    .values({
      twitchId,
      ...tokenValues,
    })
    .onConflictDoUpdate({ target: twitchTokens.twitchId, set: tokenValues });
}

/**
 * Connect bot to Twitch chat. Safe to call again, e.g. after re-auth.
 */
export async function connectToTwitchChat() {
  const config = getTwitchConfig();
  if (!config) {
    console.warn("Twitch config not set, skipping Twitch bot startup");
    return;
  }

  const storedToken = await getBotToken();
  if (!storedToken) {
    console.warn(
      "No stored Twitch token, visit /auth/twitch?secret=<TWITCH_AUTH_SECRET> to authorize bot",
    );
    return;
  }

  bot?.listener.stop();
  bot = null;

  const authProvider = new RefreshingAuthProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
  authProvider.onRefresh((userId, newToken) => {
    saveTwitchToken(userId, newToken).catch((err) =>
      console.error("Failed to save refreshed Twitch token", err),
    );
  });
  authProvider.addUser(storedToken.twitchId, storedToken.token, ["chat"]);

  const apiClient = new ApiClient({ authProvider });
  const broadcaster = await apiClient.users.getUserByName(config.channel);
  if (!broadcaster) {
    throw new Error(`Could not find Twitch user for channel ${config.channel}`);
  }

  const listener = new EventSubWsListener({ apiClient });
  const currentBot: TwitchBot = {
    apiClient,
    listener,
    twitchId: storedToken.twitchId,
    broadcasterId: broadcaster.id,
  };
  bot = currentBot;

  listener.onChannelChatMessage(
    broadcaster.id,
    storedToken.twitchId,
    (event) => {
      if (event.chatterId === currentBot.twitchId) {
        return; // Ignore bot's own messages
      }

      const reply = (text: string) => {
        return sendTwitchChatMessage(text, event.messageId);
      };
      handleChatMessage(event, reply).catch((err) =>
        console.error("Failed to handle Twitch chat message", err),
      );
    },
  );
  listener.start();

  console.log(
    `Twitch bot connected to ${config.channel} channel (${broadcaster.id})`,
  );
}

export async function sendTwitchChatMessage(
  text: string,
  replyParentMessageId?: string,
): Promise<void> {
  if (!bot) {
    return;
  }

  const { apiClient, broadcasterId, twitchId } = bot;
  await apiClient.asUser(twitchId, (baseApiClient) =>
    baseApiClient.chat.sendChatMessage(broadcasterId, text, {
      replyParentMessageId,
    }),
  );
}
