CREATE TABLE "twitch_tokens" (
	"twitch_id" text PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"scope" text[] NOT NULL,
	"expires_in" integer,
	"obtainment_timestamp" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
