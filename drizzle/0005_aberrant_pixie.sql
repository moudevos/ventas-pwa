CREATE TYPE "public"."stock_movement_type" AS ENUM('IN', 'RESERVE', 'RELEASE', 'OUT', 'ADJUSTMENT', 'PENDING_PRODUCTION');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'CREATED' BEFORE 'REGISTERED';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'PRODUCTS_INCOMPLETE' BEFORE 'PAYMENT_CONFIRMED';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'PRODUCTS_COMPLETE' BEFORE 'PAYMENT_CONFIRMED';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'PACKAGING_PAID' BEFORE 'SHIPPED';--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"order_id" uuid,
	"order_item_id" uuid,
	"movement_type" "stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock_on_hand" integer NOT NULL,
	"new_stock_on_hand" integer NOT NULL,
	"previous_stock_reserved" integer NOT NULL,
	"new_stock_reserved" integer NOT NULL,
	"reason" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "subtotal" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "reserved_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "missing_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "fulfilled_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "is_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_payment_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packaging_payment_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_pickup_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_pickup_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "has_missing_products" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "base_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_on_hand" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_reserved" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "products" SET "base_price" = COALESCE("unit_price", '0');--> statement-breakpoint
UPDATE "order_items" SET "subtotal" = COALESCE("total", '0'), "is_complete" = true WHERE "quantity" > 0;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movements_order_idx" ON "stock_movements" USING btree ("order_id");
