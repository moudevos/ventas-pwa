import { z } from "zod";

export const uuidSchema = z.uuid();

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalTrimmedString = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().optional(),
);

const optionalEmail = z.preprocess(
  emptyStringToUndefined,
  z.email().trim().optional(),
);

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});

export const createUserSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.email().trim().toLowerCase(),
  temporaryPassword: z.string().min(8),
  role: z.enum(["admin", "promoter"]).default("promoter"),
  phone: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  active: z.boolean().default(true),
  mustChangePassword: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema
  .omit({ temporaryPassword: true })
  .partial();

export const resetPasswordSchema = z.object({
  temporaryPassword: z.string().min(8),
});

export const clientSchema = z.object({
  documentType: z.enum(["DNI", "CEX"]),
  documentId: z.string().trim().optional(),
  documentNumber: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  name: z.string().min(2).trim(),
  email: optionalEmail,
  phone: optionalTrimmedString,
  address: optionalTrimmedString,
  deliveryAddress: optionalTrimmedString,
  deliveryReference: optionalTrimmedString,
  reference: optionalTrimmedString,
  ubigeo: optionalTrimmedString,
  department: optionalTrimmedString,
  province: optionalTrimmedString,
  district: optionalTrimmedString,
  city: optionalTrimmedString,
  notes: optionalTrimmedString,
  observations: optionalTrimmedString,
  active: z.boolean().default(true),
});

export const clientFindSchema = z.object({
  q: optionalTrimmedString,
  documentType: z.enum(["DNI", "CEX", "GENERIC"]).optional(),
  documentId: optionalTrimmedString,
  documentNumber: optionalTrimmedString,
  email: optionalEmail,
});

export const orderItemSchema = z.object({
  productId: uuidSchema.optional(),
  sku: z.string().trim().min(1),
  description: z.string().min(1).trim(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const saleItemSchema = z.object({
  productId: uuidSchema,
  sku: z.string().trim().min(1),
  description: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createSaleSchema = z.object({
  client: clientSchema.partial().optional(),
  paymentMethod: z.string().trim().min(1),
  notes: optionalTrimmedString,
  electronicInvoiceType: z.enum(["BOLETA", "FACTURA"]).optional(),
  items: z.array(saleItemSchema).min(1),
});

export const prepareOrderSchema = z.object({
  items: z.array(z.object({
    orderItemId: uuidSchema,
    fulfilledQuantity: z.number().int().nonnegative(),
  })).min(1),
  observation: optionalTrimmedString,
});

export const createOrderSchema = z.object({
  clientId: uuidSchema.optional(),
  client: clientSchema.optional(),
  shippingAddress: optionalTrimmedString,
  deliveryReference: optionalTrimmedString,
  orderDetails: z.string().trim().min(1),
  totalAmount: z.number().positive(),
  deliveryDate: z.iso.datetime().optional(),
  notes: optionalTrimmedString,
  observations: optionalTrimmedString,
  assignedToId: uuidSchema.optional(),
  items: z.array(orderItemSchema).optional(),
});

export const transitionOrderSchema = z.object({
  toStatus: z.enum([
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
  ]),
  reason: z.string().trim().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(10),
});

export const shipmentSchema = z.object({
  providerType: z.enum(["MOTORIZED", "COURIER"]).optional(),
  providerName: z.string().trim().optional(),
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  scheduledAt: z.iso.datetime().optional(),
  shippedAt: z.iso.datetime().optional(),
  deliveredAt: z.iso.datetime().optional(),
  notes: z.string().trim().optional(),
});

export const productFindSchema = z.object({
  sku: z.string().trim().min(1),
});

export const productSchema = z.object({
  sku: z.string().trim().min(1),
  description: z.string().trim().min(1),
  defaultUnitPrice: z.number().nonnegative().optional(),
  basePrice: z.number().nonnegative(),
  stockOnHand: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateProductSchema = productSchema.partial();

export const orderPackagingPaymentSchema = z.object({
  packagingCost: z.number().nonnegative(),
  scheduledShippingDate: z.union([z.iso.date(), z.iso.datetime()]),
  evidenceUrl: z.url().optional(),
  observation: z.string().trim().optional(),
});

export const registerProductPaymentSchema = z.object({
  productPaymentAmount: z.number().positive(),
  productPaymentMethod: z.string().trim().min(1),
  productPaymentDate: z.union([z.iso.date(), z.iso.datetime()]),
  scheduledShippingDate: z.union([z.iso.date(), z.iso.datetime()]).optional(),
  packagingCost: z.number().nonnegative().default(2),
  observation: optionalTrimmedString,
});

export const markReadyToShipSchema = z.object({
  packagingPaymentAmount: z.number().positive(),
  packagingPaymentMethod: z.string().trim().min(1),
  packagingPaymentDate: z.union([z.iso.date(), z.iso.datetime()]),
  observation: optionalTrimmedString,
});

export const shipOrderSchema = z
  .object({
  shippingType: z.enum(["MOTORIZED", "COURIER"]),
  providerName: z.string().trim().min(1),
    trackingNumber: optionalTrimmedString,
    deliveryOrderNumber: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    if (value.shippingType === "COURIER" && !value.trackingNumber) {
      ctx.addIssue({ code: "custom", path: ["trackingNumber"], message: "Tracking requerido para courier" });
    }
    if (value.shippingType === "MOTORIZED" && !value.deliveryOrderNumber) {
      ctx.addIssue({ code: "custom", path: ["deliveryOrderNumber"], message: "Numero de envio requerido para motorizado" });
    }
  });

export const closeOrderSchema = z.object({
  customerReceivedConfirmed: z.literal(true).optional(),
  carrierDeliveredConfirmed: z.literal(true).optional(),
  customerPickupConfirmed: z.literal(true).optional(),
  observation: optionalTrimmedString,
});

export const stockInSchema = z.object({
  quantity: z.number().int().positive(),
  reason: optionalTrimmedString,
});

export const adjustStockSchema = z.object({
  stockOnHand: z.number().int().nonnegative(),
  reason: z.string().trim().min(1),
});


export const orderObservationSchema = z.object({
  observation: z.string().trim().optional(),
});

export const scheduleShipmentSchema = z.object({
  scheduledShippingAt: z.iso.datetime(),
});

export const evidenceSchema = z.object({
  type: z.enum(["photo", "signature", "document", "note"]),
  url: z.url(),
  description: z.string().trim().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
