import type { OrderStatus, UserRole } from "@/server/db/schema";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["PAID", "CANCELLED", "OBSERVED"],
  REGISTERED: ["PAID", "OBSERVED", "CANCELLED"],
  PAID: ["PRODUCTS_INCOMPLETE", "PRODUCTS_COMPLETE", "OBSERVED", "CANCELLED"],
  PRODUCTS_INCOMPLETE: ["PRODUCTS_COMPLETE", "OBSERVED", "CANCELLED"],
  PRODUCTS_COMPLETE: ["READY_TO_SHIP", "OBSERVED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["SCHEDULED", "OBSERVED", "CANCELLED"],
  SCHEDULED: ["READY_TO_SHIP", "OBSERVED", "CANCELLED"],
  READY_TO_SHIP: ["PACKAGING_PAID", "OBSERVED", "CANCELLED"],
  PACKAGING_PAID: ["SHIPPED", "OBSERVED", "CANCELLED"],
  SHIPPED: ["CLOSED", "OBSERVED"],
  DELIVERED: ["CLOSED", "OBSERVED"],
  CLOSED: [],
  OBSERVED: ["REGISTERED", "SCHEDULED", "CANCELLED"],
  CANCELLED: [],
};

const roleTransitions: Record<UserRole, OrderStatus[]> = {
  admin: [
    "REGISTERED",
    "CREATED",
    "PAID",
    "PRODUCTS_INCOMPLETE",
    "PRODUCTS_COMPLETE",
    "PAYMENT_CONFIRMED",
    "SCHEDULED",
    "READY_TO_SHIP",
    "PACKAGING_PAID",
    "SHIPPED",
    "DELIVERED",
    "CLOSED",
    "OBSERVED",
    "CANCELLED",
  ],
  promoter: ["PAID", "PRODUCTS_INCOMPLETE", "PRODUCTS_COMPLETE", "READY_TO_SHIP", "PACKAGING_PAID", "SHIPPED", "CLOSED", "OBSERVED", "CANCELLED"],
};

export function assertOrderTransition(params: {
  from: OrderStatus;
  to: OrderStatus;
  role: UserRole;
  hasItems: boolean;
  hasMissingProducts?: boolean;
  productPaymentConfirmed?: boolean;
  packagingPaymentConfirmed?: boolean;
  scheduledShippingAt?: Date | null;
  packagedAt?: Date | null;
  shippingProviderName?: string | null;
  deliveredAt?: Date | null;
  customerReceivedConfirmed?: boolean;
  carrierDeliveredConfirmed?: boolean;
}) {
  if (!transitions[params.from].includes(params.to)) {
    throw new Error(`Invalid order transition from ${params.from} to ${params.to}`);
  }
  if (!roleTransitions[params.role].includes(params.to)) {
    throw new Error("Role cannot perform this transition");
  }
  if (params.to === "PAID" && !params.productPaymentConfirmed) {
    throw new Error("Product payment must be registered first");
  }
  if (params.to === "PRODUCTS_COMPLETE" && params.hasMissingProducts) {
    throw new Error("Order has missing products");
  }
  if (params.to === "READY_TO_SHIP" && params.hasMissingProducts) {
    throw new Error("All products must be complete before ready to ship");
  }
  if (params.to === "PACKAGING_PAID" && !params.packagingPaymentConfirmed) {
    throw new Error("Packaging payment must be registered before marking ready to ship");
  }
  if (params.to === "SHIPPED" && !params.shippingProviderName) {
    throw new Error("Shipping provider is required before shipping");
  }
  if (params.to === "CLOSED" && (!params.customerReceivedConfirmed || !params.carrierDeliveredConfirmed)) {
    throw new Error("Customer and carrier delivery confirmations are required before closing");
  }
}
