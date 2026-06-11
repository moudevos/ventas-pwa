export type ApiResult<T> = { data: T };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as { data?: T; error?: { message?: string } };
  if (!response.ok) {
    const details = (payload.error as { details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] } } | undefined)?.details;
    const fieldMessages = details?.fieldErrors
      ? Object.entries(details.fieldErrors).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
      : [];
    const formMessages = details?.formErrors ?? [];
    throw new Error([payload.error?.message ?? "No se pudo completar la solicitud", ...fieldMessages, ...formMessages].filter(Boolean).join(". "));
  }
  return payload.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
};

export type UserDto = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "promoter";
  phone?: string | null;
  status?: "active" | "inactive";
  active: boolean;
  mustChangePassword: boolean;
  temporaryPasswordVisible?: string | null;
};

export type ClientDto = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  documentType?: "DNI" | "CEX" | null;
  documentId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  deliveryReference?: string | null;
  ubigeo?: string | null;
  department?: string | null;
  province?: string | null;
  district?: string | null;
};

export type OrderStatus =
  | "CREATED"
  | "REGISTERED"
  | "PAID"
  | "PRODUCTS_INCOMPLETE"
  | "PRODUCTS_COMPLETE"
  | "PAYMENT_CONFIRMED"
  | "SCHEDULED"
  | "READY_TO_SHIP"
  | "PACKAGING_PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CLOSED"
  | "OBSERVED"
  | "CANCELLED";

export type OrderDto = {
  id: string;
  code: string;
  status: OrderStatus;
  clientId: string;
  subtotal: string;
  tax: string;
  total: string;
  totalAmount?: string | null;
  totalProductsAmount?: string | null;
  totalOrderAmount?: string | null;
  productPaymentAmount?: string | null;
  productPaymentMethod?: string | null;
  productPaymentDate?: string | null;
  productPaymentConfirmed?: boolean;
  packagingCost?: string | null;
  packagingPaymentAmount?: string | null;
  packagingPaymentMethod?: string | null;
  packagingPaymentDate?: string | null;
  packagingPaymentConfirmed?: boolean;
  shippingAddress?: string | null;
  scheduledShippingDate?: string | null;
  shippingType?: "MOTORIZED" | "COURIER" | "PICKUP" | null;
  providerName?: string | null;
  trackingNumber?: string | null;
  deliveryOrderNumber?: string | null;
  shippedAt?: string | null;
  customerReceivedConfirmed?: boolean;
  customerPickupConfirmed?: boolean;
  customerPickupConfirmedAt?: string | null;
  carrierDeliveredConfirmed?: boolean;
  hasMissingProducts?: boolean;
  closedAt?: string | null;
  notes?: string | null;
};
