ALTER TYPE "public"."order_status" ADD VALUE 'PAID' BEFORE 'PAYMENT_CONFIRMED';--> statement-breakpoint
UPDATE "orders" SET "order_details" = COALESCE("order_details", "notes", 'Pedido sin detalle') WHERE "order_details" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "order_details" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "packaging_cost" SET DEFAULT '2.00';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_products_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_order_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
UPDATE "orders" SET "total_products_amount" = COALESCE("total_amount", "total", '0'), "total_order_amount" = COALESCE("total_amount", "total", '0');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_payment_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_payment_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_payment_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packaging_payment_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packaging_payment_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_order_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_received_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "carrier_delivered_confirmed" boolean DEFAULT false NOT NULL;
