CREATE TABLE "uploaded_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"entity_id" uuid,
	"file_key" text NOT NULL,
	"public_url" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"original_name" text NOT NULL,
	"uploaded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_image_url" text;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uploaded_files_key_idx" ON "uploaded_files" USING btree ("file_key");--> statement-breakpoint
CREATE INDEX "uploaded_files_entity_idx" ON "uploaded_files" USING btree ("scope","entity_id");