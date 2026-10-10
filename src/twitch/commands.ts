import { readdirSync } from "node:fs";
import path from "node:path";

import type { EventSubChannelChatMessageEvent } from "@twurple/eventsub-base";

import { emitOverlayEvent } from "../overlay/events.js";

const GLOBAL_COOLDOWN_MS = 200;
const USER_COOLDOWN_MS = 1000 * 60 * 1; // 1min
const DEFAULT_SOUND = "denji";

let lastWoofAt = 0;
const lastWoofByUser = new Map<string, number>();

const soundFilenames = new Set(
  readdirSync("./public/sounds")
    .filter((file) => file.endsWith(".mp3"))
    .map((file) => path.basename(file, ".mp3")),
);

export async function handleChatMessage(
  event: EventSubChannelChatMessageEvent,
  reply: (text: string) => Promise<void>,
): Promise<void> {
  if (event.messageText[0] !== "!") {
    return;
  }

  const [command, arg] = event.messageText.trim().split(/\s+/);
  switch (command?.toLowerCase()) {
    case "!woof":
      return woof(event, arg);
  }
}

function resolveSoundName(name?: string | null): string {
  const normalized = name?.toLowerCase();
  return normalized && soundFilenames.has(normalized)
    ? normalized
    : DEFAULT_SOUND;
}

async function woof(
  event: EventSubChannelChatMessageEvent,
  arg?: string,
): Promise<void> {
  const now = Date.now();
  const userLastWoofAt = lastWoofByUser.get(event.chatterId) ?? 0;

  if (now - lastWoofAt < GLOBAL_COOLDOWN_MS) {
    return;
  }
  if (now - userLastWoofAt < USER_COOLDOWN_MS) {
    return;
  }

  lastWoofAt = now;
  lastWoofByUser.set(event.chatterId, now);

  const sound = resolveSoundName(arg);
  emitOverlayEvent({ type: "woof", user: event.chatterDisplayName, sound });
}
