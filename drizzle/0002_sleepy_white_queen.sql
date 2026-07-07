CREATE TABLE "user_media" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"media_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_media_media_url_unique" UNIQUE("media_url")
);
--> statement-breakpoint
ALTER TABLE "user_media" ADD CONSTRAINT "user_media_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_media_userId_idx" ON "user_media" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "post" DROP COLUMN "image_url";