ALTER TABLE "user_media" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "user_media" ADD COLUMN "content_type" text;--> statement-breakpoint
ALTER TABLE "user_media" ADD COLUMN "size_bytes" integer;--> statement-breakpoint
ALTER TABLE "user_media" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "user_media"
SET
	"display_name" = COALESCE(NULLIF(regexp_replace("media_url", '^.*/', ''), ''), 'Uploaded media'),
	"content_type" = 'application/octet-stream',
	"size_bytes" = 0
WHERE "display_name" IS NULL OR "content_type" IS NULL OR "size_bytes" IS NULL;--> statement-breakpoint
ALTER TABLE "user_media" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_media" ALTER COLUMN "content_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_media" ALTER COLUMN "size_bytes" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "user_media_userId_createdAt_idx" ON "user_media" USING btree ("user_id","created_at");
