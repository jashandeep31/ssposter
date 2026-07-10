CREATE TABLE "post_publish" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"platform" text NOT NULL,
	"connected_account_id" text,
	"publish_version" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_post_id" text,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "publish_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "queued_at" timestamp;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "last_publish_error" text;--> statement-breakpoint
ALTER TABLE "post_publish" ADD CONSTRAINT "post_publish_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_publish" ADD CONSTRAINT "post_publish_connected_account_id_connected_account_id_fk" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_publish_postId_idx" ON "post_publish" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_publish_status_idx" ON "post_publish" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "post_publish_post_platform_version_unique" ON "post_publish" USING btree ("post_id","platform","publish_version");