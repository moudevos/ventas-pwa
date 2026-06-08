CREATE TYPE "public"."sale_channel" AS ENUM('STORE');--> statement-breakpoint
CREATE TYPE "public"."stock_source_type" AS ENUM('ORDER', 'STORE_SALE', 'MANUAL', 'PRODUCTION');--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'GENERIC';--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"client_id" uuid,
	"channel" "sale_channel" DEFAULT 'STORE' NOT NULL,
	"sale_date" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_method" text NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"notes" text,
	"electronic_invoice_status" text DEFAULT 'PENDING' NOT NULL,
	"electronic_invoice_type" text,
	"electronic_invoice_series" text,
	"electronic_invoice_number" text,
	"electronic_invoice_hash" text,
	"customer_document_type" text,
	"customer_document_number" text,
	"customer_legal_name" text,
	"taxable_amount" numeric(12, 2),
	"igv_amount" numeric(12, 2),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "source_type" "stock_source_type";--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_code_idx" ON "sales" USING btree ("code");