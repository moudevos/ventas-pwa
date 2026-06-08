CREATE TYPE "public"."document_type" AS ENUM('DNI', 'CEX');--> statement-breakpoint
CREATE TYPE "public"."shipping_provider_type" AS ENUM('MOTORIZED', 'COURIER');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"description" text NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "from_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "to_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'REGISTERED'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('REGISTERED', 'PAYMENT_CONFIRMED', 'SCHEDULED', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CLOSED', 'OBSERVED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "from_status" SET DATA TYPE "public"."order_status" USING "from_status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "to_status" SET DATA TYPE "public"."order_status" USING "to_status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'REGISTERED'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "document_type" "document_type";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "delivery_reference" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "ubigeo" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "province" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "district" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_reference" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "scheduled_shipping_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packaging_payment_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packaging_payment_confirmed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packaging_payment_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packaged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_provider_type" "shipping_provider_type";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_provider_name" text;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_packaging_payment_confirmed_by_id_users_id_fk" FOREIGN KEY ("packaging_payment_confirmed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;