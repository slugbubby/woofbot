import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
