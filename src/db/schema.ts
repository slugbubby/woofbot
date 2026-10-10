import { bigint, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const chatters = pgTable("chatters", {
  twitchId: text("twitch_id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  dogBreed: text("dog_breed"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * https://twurple.js.org/reference/auth/interfaces/AccessToken.html
 */
export const twitchTokens = pgTable("twitch_tokens", {
  twitchId: text("twitch_id").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  scope: text("scope").array().notNull(),
  expiresIn: integer("expires_in"),
  obtainmentTimestamp: bigint("obtainment_timestamp", {
    mode: "number",
  }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Chatter = typeof chatters.$inferSelect;
export type NewChatter = typeof chatters.$inferInsert;

export type TwitchToken = typeof twitchTokens.$inferSelect;
export type NewTwitchToken = typeof twitchTokens.$inferInsert;
