import { randomUUID } from "node:crypto";

import { exchangeCode, getTokenInfo } from "@twurple/auth";
import { Hono } from "hono";

import {
  connectToTwitchChat,
  getTwitchConfig,
  saveTwitchToken,
} from "./client.js";

const BOT_SCOPES = ["user:read:chat", "user:write:chat", "user:bot"];

// OAuth CSRF states we've handed out and not seen back yet
const pendingStates = new Set<string>();

export const twitchAuthRoutes = new Hono()
  .get("/", (c) => {
    const config = getTwitchConfig();
    if (!config) {
      return c.text("Twitch env not set", 500);
    }
    if (c.req.query("secret") !== config.authSecret) {
      return c.text("LEAVE NOW", 403);
    }

    const state = randomUUID();
    pendingStates.add(state);

    const url = new URL("https://id.twitch.tv/oauth2/authorize");
    url.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: BOT_SCOPES.join(" "),
      state,
      force_verify: "true", // Always show login screen to pick bot account
    }).toString();

    return c.redirect(url.toString());
  })

  .get("/callback", async (c) => {
    const config = getTwitchConfig();
    if (!config) {
      return c.text("Twitch env not set", 500);
    }

    const { code, state, error } = c.req.query();
    if (error) {
      return c.text(`Twitch error: ${error}`, 400);
    }
    if (!code || !state || !pendingStates.delete(state)) {
      return c.text("Bad/expired state. Start over at /auth/twitch", 400);
    }

    const token = await exchangeCode(
      config.clientId,
      config.clientSecret,
      code,
      config.redirectUri,
    );
    const tokenInfo = await getTokenInfo(token.accessToken, config.clientId);
    if (!tokenInfo.userId) {
      return c.text("Token has no user", 400);
    }

    await saveTwitchToken(tokenInfo.userId, token);
    await connectToTwitchChat();
    return c.text(`Connected as ${tokenInfo.userName}`);
  });
