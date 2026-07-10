CREATE TABLE "post_publish_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"post_publish_id" text NOT NULL,
	"attempt" integer NOT NULL,
	"status" text NOT NULL,
	"qstash_message_id" text,
	"error" text,
	"provider_post_id" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "post_publish" ADD COLUMN "account_display_name" text;--> statement-breakpoint
ALTER TABLE "post_publish" ADD COLUMN "account_username" text;--> statement-breakpoint
ALTER TABLE "post_publish" ADD COLUMN "account_avatar_url" text;--> statement-breakpoint
ALTER TABLE "post_publish" ADD COLUMN "queued_at" timestamp;--> statement-breakpoint
ALTER TABLE "post_publish" ADD COLUMN "qstash_message_id" text;--> statement-breakpoint
ALTER TABLE "post_publish" ADD COLUMN "processing_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "post_publish_attempt" ADD CONSTRAINT "post_publish_attempt_post_publish_id_post_publish_id_fk" FOREIGN KEY ("post_publish_id") REFERENCES "public"."post_publish"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_publish_attempt_target_idx" ON "post_publish_attempt" USING btree ("post_publish_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_publish_attempt_target_number_unique" ON "post_publish_attempt" USING btree ("post_publish_id","attempt");--> statement-breakpoint
CREATE INDEX "post_userId_createdAt_idx" ON "post" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "post_userId_publishAt_idx" ON "post" USING btree ("user_id","publish_at");--> statement-breakpoint
CREATE INDEX "post_publish_post_version_idx" ON "post_publish" USING btree ("post_id","publish_version");