CREATE TABLE "post_media" (
	"post_id" text NOT NULL,
	"media_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_media_post_id_media_id_pk" PRIMARY KEY("post_id","media_id")
);
--> statement-breakpoint
ALTER TABLE "post" DROP CONSTRAINT "post_media_id_user_media_id_fk";
--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_media_id_user_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "post_media" ("post_id", "media_id")
SELECT "id", "media_id"
FROM "post"
WHERE "media_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "post_media_mediaId_idx" ON "post_media" USING btree ("media_id");--> statement-breakpoint
ALTER TABLE "post" DROP COLUMN "media_id";
