import { readdirSync } from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import type { EventSubChannelChatMessageEvent } from "@twurple/eventsub-base";

import { emitOverlayEvent } from "../overlay/events.js";
import { db } from "../db/index.js";
import { chatters, type NewChatter } from "../db/schema.js";

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
    case "!dog":
      return dog(event, arg, reply);
    case "!woof":
      return woof(event, arg);
  }
}

async function dog(
  event: EventSubChannelChatMessageEvent,
  arg: string,
  reply: (text: string) => Promise<void>,
): Promise<void> {
  const dogs = ["dachshund", "greatdane", "husky", "pug", "shiba"];

  if (!dogs.includes(arg)) {
    reply(`404 dog not found. send a soundbite or choose: ${dogs.join(" ")}`);
    return;
  }

  const newChatter: NewChatter = {
    twitchId: event.chatterId,
    username: event.chatterName,
    displayName: event.chatterDisplayName,
    dogBreed: arg,
  };
  await db
    .insert(chatters)
    .values(newChatter)
    .onConflictDoUpdate({ target: chatters.twitchId, set: { dogBreed: arg } });
}

function resolveSoundName(name?: string): string | null {
  const normalized = name?.toLowerCase();
  return normalized && soundFilenames.has(normalized) ? normalized : null;
}

async function woof(
  event: EventSubChannelChatMessageEvent,
  arg?: string,
): Promise<void> {
  const now = Date.now();
  const userLastWoofAt = lastWoofByUser.get(event.chatterId) ?? 0;

  if (
    now - lastWoofAt < GLOBAL_COOLDOWN_MS &&
    event.chatterName.toLowerCase() !== "slugbubby"
  ) {
    return;
  }
  if (
    now - userLastWoofAt < USER_COOLDOWN_MS &&
    event.chatterName.toLowerCase() !== "slugbubby"
  ) {
    return;
  }

  lastWoofAt = now;
  lastWoofByUser.set(event.chatterId, now);

  const customSound =
    resolveSoundName(arg) || resolveSoundName(event.chatterName.toLowerCase());
  let chatterDogBreed;
  if (!customSound) {
    const [chatter] = await db
      .select({ dogBreed: chatters.dogBreed })
      .from(chatters)
      .where(eq(chatters.twitchId, event.chatterId))
      .limit(1);
    chatterDogBreed = chatter?.dogBreed;
  }
  const sound = customSound || chatterDogBreed || DEFAULT_SOUND;
  emitOverlayEvent({ type: "woof", user: event.chatterDisplayName, sound });
}
