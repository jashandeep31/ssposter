CREATE TABLE "connected_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"display_name" text,
	"username" text,
	"avatar_url" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_type" text,
	"scope" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connected_account" ADD CONSTRAINT "connected_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "connected_account_userId_idx" ON "connected_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "connected_account_platform_idx" ON "connected_account" USING btree ("platform");--> statement-breakpoint
CREATE UNIQUE INDEX "connected_account_user_platform_provider_unique" ON "connected_account" USING btree ("user_id","platform","provider_account_id");