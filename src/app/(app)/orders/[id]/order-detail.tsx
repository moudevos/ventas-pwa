"use client";

import { AlertTriangle, CheckCircle2, Circle, CreditCard, FilePlus, PackageCheck, Truck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { ButtonSpinner, PageLoader } from "@/components/loading";
import { showError, showToast } from "@/lib/alerts";
import { api, type OrderDto, type OrderStatus } from "@/lib/api-client";
import { getOrderStatusBadgeClass, getOrderStatusLabel, ORDER_STATUS_FLOW } from "@/lib/order-status";

type OrderDetail = OrderDto & {
  code: string;
  orderDetails?: string | null;
  observations?: string | null;
  totalProductsAmount?: string | null;
  totalOrderAmount?: string | null;
  productPaymentAmount?: string | null;
  productPaymentDate?: string | null;
  productPaymentConfirmed?: boolean;
  packagingCost?: string | null;
  packagingPaymentAmount?: string | null;
  packagingPaymentDate?: string | null;
  scheduledShippingDate?: string | null;
  shippingType?: "MOTORIZED" | "COURIER" | null;
  providerName?: string | null;
  trackingNumber?: string | null;
  deliveryOrderNumber?: string | null;
  customerReceivedConfirmed?: boolean;
  carrierDeliveredConfirmed?: boolean;
  items: Array<{ id: string; sku?: string | null; description: string; quantity: number; unitPrice: string; total: string; reservedQuantity?: number; missingQuantity?: number; fulfilledQuantity?: number; isComplete?: boolean }>;
  evidence: Array<{ id: string; type: string; url: string; description?: string | null }>;
  history: Array<{ id: string; toStatus: OrderStatus; fromStatus?: OrderStatus | null; reason?: string | null; createdAt: string; actorName?: string | null }>;
};

export function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [pending, setPending] = useState(false);
  const [modal, setModal] = useState<"payment" | "prepare" | "packaging" | "ship" | "close" | null>(null);

  async function loadOrder() {
    setOrder(await api.get<OrderDetail>(`/api/orders/${id}`));
  }

  useEffect(() => {
    api.get<OrderDetail>(`/api/orders/${id}`).then(setOrder).catch((err) => void showError(err.message));
  }, [id]);

  async function runAction(fn: () => Promise<void>) {
    setPending(true);
    try {
      await fn();
      await loadOrder();
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo completar la accion");
    } finally {
      setPending(false);
    }
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const productPaymentAmount = Number(form.get("productPaymentAmount") || 0);
    const productPaymentMethod = String(form.get("productPaymentMethod") || "");
    const productPaymentDate = String(form.get("productPaymentDate") || "");
    if (productPaymentAmount <= 0) return showError("Ingresa monto pagado del pedido");
    if (!productPaymentMethod) return showError("Ingresa metodo de pago");
    if (!productPaymentDate) return showError("Ingresa fecha de pago");
    await runAction(async () => {
      await api.post(`/api/orders/${id}/register-product-payment`, {
        productPaymentAmount,
        productPaymentMethod,
        productPaymentDate,
        scheduledShippingDate: form.get("scheduledShippingDate") || undefined,
        packagingCost: Number(form.get("packagingCost") || 2),
        observation: form.get("observation") || undefined,
      });
      await showToast("Pedido pagado");
      setModal(null);
    });
  }

  async function submitPackaging(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const packagingPaymentAmount = Number(form.get("packagingPaymentAmount") || 0);
    const packagingPaymentMethod = String(form.get("packagingPaymentMethod") || "");
    const packagingPaymentDate = String(form.get("packagingPaymentDate") || "");
    if (packagingPaymentAmount <= 0) return showError("Ingresa monto de embalaje");
    if (!packagingPaymentMethod) return showError("Ingresa metodo de pago de embalaje");
    if (!packagingPaymentDate) return showError("Ingresa fecha de pago de embalaje");
    await runAction(async () => {
      await api.post(`/api/orders/${id}/mark-ready-to-ship`, { packagingPaymentAmount, packagingPaymentMethod, packagingPaymentDate });
      await showToast("Embalaje pagado");
      setModal(null);
    });
  }

  async function submitPrepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    const form = new FormData(event.currentTarget);
    const items: Array<{ orderItemId: string; fulfilledQuantity: number }> = [];
    for (const item of order.items) {
      const fulfilledQuantity = Number(form.get(`prepared-${item.id}`) || 0);
      if (fulfilledQuantity > item.quantity) return showError("No puedes alistar mas de lo solicitado");
      if (fulfilledQuantity > (item.reservedQuantity ?? 0)) return showError("No puedes alistar mas que lo reservado");
      items.push({ orderItemId: item.id, fulfilledQuantity });
    }
    await runAction(async () => {
      await api.post(`/api/orders/${id}/prepare-products`, { items, observation: form.get("observation") || undefined });
      await showToast("Alistado actualizado");
      setModal(null);
    });
  }

  async function submitShip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const shippingType = String(form.get("shippingType") || "");
    const providerName = String(form.get("providerName") || "");
    const trackingNumber = String(form.get("trackingNumber") || "");
    const deliveryOrderNumber = String(form.get("deliveryOrderNumber") || "");
    if (!providerName) return showError("Ingresa proveedor");
    if (shippingType === "COURIER" && !trackingNumber) return showError("Tracking requerido para courier");
    if (shippingType === "MOTORIZED" && !deliveryOrderNumber) return showError("Numero de envio requerido para motorizado");
    await runAction(async () => {
      await api.post(`/api/orders/${id}/ship`, { shippingType, providerName, trackingNumber, deliveryOrderNumber });
      await showToast("Envio registrado");
      setModal(null);
    });
  }

  async function submitClose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customerPickupConfirmed = form.get("customerPickupConfirmed") === "on";
    if (!customerPickupConfirmed) return showError("Confirma que el cliente recibio");
    await runAction(async () => {
      await api.post(`/api/orders/${id}/close`, { customerPickupConfirmed, observation: form.get("observation") || undefined });
      await showToast("Pedido cerrado");
      setModal(null);
    });
  }

  if (!order) return <PageLoader label="Cargando detalle..." />;

  return (
    <div className="relative mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="space-y-6">
        <article className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-500">{order.code}</p>
              <h2 className="text-xl font-semibold">Resumen del pedido</h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${getOrderStatusBadgeClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p><span className="text-neutral-500">Total:</span> S/ {order.totalAmount ?? order.total}</p>
            <p><span className="text-neutral-500">Embalaje:</span> S/ {order.packagingCost ?? "0.00"}</p>
            <p><span className="text-neutral-500">Envio:</span> {order.scheduledShippingDate ? new Date(order.scheduledShippingDate).toLocaleDateString() : "Pendiente"}</p>
            <p><span className="text-neutral-500">Proveedor:</span> {order.providerName ?? "Pendiente"}</p>
            <p><span className="text-neutral-500">Pago productos:</span> {order.productPaymentConfirmed ? `S/ ${order.productPaymentAmount}` : "Pendiente"}</p>
            <p><span className="text-neutral-500">Pago embalaje:</span> {order.packagingPaymentConfirmed ? `S/ ${order.packagingPaymentAmount}` : "Pendiente"}</p>
          </div>
          <div className="mt-4 rounded-md bg-neutral-50 p-3 text-sm">{order.orderDetails}</div>
          {order.observations ? <p className="mt-3 text-sm text-neutral-600">{order.observations}</p> : null}
        </article>
        <article className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Prendas</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500"><tr><th>SKU</th><th>Descripcion</th><th>Cant.</th><th>Reserv.</th><th>Falta</th><th>Total</th></tr></thead>
              <tbody>
                {order.items.map((item) => (
                  <tr className="border-t" key={item.id}>
                    <td className="py-2">{item.sku ?? "-"}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.reservedQuantity ?? 0}</td>
                    <td className={(item.missingQuantity ?? 0) > 0 ? "font-medium text-amber-700" : ""}>{item.missingQuantity ?? 0}</td>
                    <td>S/ {item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <Timeline order={order} />
      </section>

      <aside className="space-y-4">
        <article className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Acciones</h2>
          <div className="mt-4 grid gap-2">
            {order.status === "REGISTERED" ? <ActionButton icon={<CreditCard size={17} />} label="Registrar pago" onClick={() => setModal("payment")} pending={pending} /> : null}
            {order.status === "CREATED" ? <ActionButton icon={<CreditCard size={17} />} label="Registrar pago" onClick={() => setModal("payment")} pending={pending} /> : null}
            {["PAID", "PRODUCTS_INCOMPLETE", "PRODUCTS_COMPLETE"].includes(order.status) ? <ActionButton icon={<PackageCheck size={17} />} label="Alistar productos" onClick={() => setModal("prepare")} pending={pending} /> : null}
            {order.status === "PAID" && order.hasMissingProducts ? <ActionButton icon={<PackageCheck size={17} />} label="Marcar incompleto" onClick={() => runAction(async () => { await api.post(`/api/orders/${id}/mark-products-incomplete`); })} pending={pending} /> : null}
            {["PAID", "PRODUCTS_INCOMPLETE"].includes(order.status) && !order.hasMissingProducts ? <ActionButton icon={<PackageCheck size={17} />} label="Productos completos" onClick={() => runAction(async () => { await api.post(`/api/orders/${id}/complete-products`); })} pending={pending} /> : null}
            {order.status === "PRODUCTS_COMPLETE" ? <ActionButton icon={<PackageCheck size={17} />} label="Listo para envio" onClick={() => runAction(async () => { await api.post(`/api/orders/${id}/ready-to-ship`); })} pending={pending} /> : null}
            {order.status === "READY_TO_SHIP" ? <ActionButton icon={<PackageCheck size={17} />} label="Registrar embalaje" onClick={() => setModal("packaging")} pending={pending} /> : null}
            {order.status === "PACKAGING_PAID" ? <ActionButton icon={<Truck size={17} />} label="Registrar envio" onClick={() => setModal("ship")} pending={pending} /> : null}
            {order.status === "SHIPPED" ? <ActionButton icon={<CheckCircle2 size={17} />} label="Cerrar pedido" onClick={() => setModal("close")} pending={pending} /> : null}
            {order.status === "CLOSED" ? <p className="text-sm text-neutral-500">Pedido cerrado. Solo lectura.</p> : null}
          </div>
        </article>
      </aside>
      {modal === "payment" ? <PaymentModal order={order} pending={pending} onClose={() => setModal(null)} onSubmit={submitPayment} /> : null}
      {modal === "prepare" ? <PrepareModal order={order} pending={pending} onClose={() => setModal(null)} onSubmit={submitPrepare} /> : null}
      {modal === "packaging" ? <PackagingModal pending={pending} onClose={() => setModal(null)} onSubmit={submitPackaging} /> : null}
      {modal === "ship" ? <ShipModal pending={pending} onClose={() => setModal(null)} onSubmit={submitShip} /> : null}
      {modal === "close" ? <CloseModal pending={pending} onClose={() => setModal(null)} onSubmit={submitClose} /> : null}
    </div>
  );
}

function ActionButton({ icon, label, onClick, pending }: { icon: React.ReactNode; label: string; onClick: () => void; pending: boolean }) {
  return (
    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-white disabled:opacity-60" disabled={pending} onClick={onClick} type="button">
      {pending ? <ButtonSpinner /> : icon} {label}
    </button>
  );
}

function ModalFrame({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="rounded-md border px-3 py-1 text-sm" onClick={onClose} type="button">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, pending, submitLabel }: { onClose: () => void; pending: boolean; submitLabel: string }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button className="h-10 rounded-md border px-4" disabled={pending} onClick={onClose} type="button">Cancelar</button>
      <button className="inline-flex h-10 items-center gap-2 rounded-md bg-indigo-600 px-4 text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? <ButtonSpinner /> : null} {pending ? "Procesando..." : submitLabel}
      </button>
    </div>
  );
}

function TextField({ defaultValue, label, name, required, step, type = "text" }: { defaultValue?: string | number; label: string; name: string; required?: boolean; step?: string; type?: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">{label}
      <input className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={defaultValue} name={name} required={required} step={step} type={type} />
    </label>
  );
}

function PaymentMethodSelect({ name }: { name: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">Metodo de pago
      <select className="mt-1 h-10 w-full rounded-md border px-3" name={name} required>
        <option value="">Seleccionar</option>
        {["YAPE", "PLIN", "TRANSFERENCIA", "TARJETA", "EFECTIVO", "OTRO"].map((method) => <option key={method} value={method}>{method}</option>)}
      </select>
    </label>
  );
}

function PaymentModal({ onClose, onSubmit, order, pending }: { onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; order: OrderDetail; pending: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultAmount = order.totalProductsAmount ?? order.totalAmount ?? order.total ?? "0.00";
  return (
    <ModalFrame onClose={onClose} title="Registrar pago">
      <form className="grid gap-3" onSubmit={onSubmit}>
        <TextField defaultValue={defaultAmount} label="Monto pagado" name="productPaymentAmount" required step="0.01" type="number" />
        <PaymentMethodSelect name="productPaymentMethod" />
        <TextField defaultValue={today} label="Fecha de pago" name="productPaymentDate" required type="date" />
        <TextField label="Fecha programada de envio" name="scheduledShippingDate" type="date" />
        <TextField defaultValue="2.00" label="Costo de embalaje" name="packagingCost" step="0.01" type="number" />
        <label className="block text-sm font-medium text-slate-700">Observacion
          <textarea className="mt-1 min-h-20 w-full rounded-md border px-3 py-2" name="observation" />
        </label>
        <ModalActions onClose={onClose} pending={pending} submitLabel="Guardar pago" />
      </form>
    </ModalFrame>
  );
}

function PrepareModal({ onClose, onSubmit, order, pending }: { onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; order: OrderDetail; pending: boolean }) {
  return (
    <ModalFrame onClose={onClose} title="Alistar productos">
      <form onSubmit={onSubmit}>
        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="border border-slate-300 px-3 py-2">Producto</th>
                <th className="border border-slate-300 px-3 py-2">Solicitado</th>
                <th className="border border-slate-300 px-3 py-2">Reservado</th>
                <th className="border border-slate-300 px-3 py-2">Faltante</th>
                <th className="border border-slate-300 px-3 py-2">Ya alistado</th>
                <th className="border border-slate-300 px-3 py-2">Alistar</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 px-3 py-2"><span className="font-medium">{item.sku ?? "-"}</span><br /><span className="text-xs text-slate-500">{item.description}</span></td>
                  <td className="border border-slate-300 px-3 py-2">{item.quantity}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.reservedQuantity ?? 0}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.missingQuantity ?? 0}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.fulfilledQuantity ?? 0}</td>
                  <td className="border border-slate-300 px-3 py-2">
                    <input className="h-9 w-24 rounded-md border border-slate-400 px-2" defaultValue={item.fulfilledQuantity ?? 0} max={Math.min(item.quantity, item.reservedQuantity ?? 0)} min="0" name={`prepared-${item.id}`} type="number" />
                    {(item.reservedQuantity ?? 0) <= 0 ? <p className="mt-1 text-xs text-amber-700">Sin reserva disponible</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="mt-3 block text-sm font-medium text-slate-700">Observacion
          <textarea className="mt-1 min-h-20 w-full rounded-md border px-3 py-2" name="observation" />
        </label>
        <ModalActions onClose={onClose} pending={pending} submitLabel="Guardar alistado" />
      </form>
    </ModalFrame>
  );
}

function PackagingModal({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; pending: boolean }) {
  return (
    <ModalFrame onClose={onClose} title="Registrar pago de embalaje">
      <form className="grid gap-3" onSubmit={onSubmit}>
        <TextField label="Monto pagado de embalaje" name="packagingPaymentAmount" required step="0.01" type="number" />
        <PaymentMethodSelect name="packagingPaymentMethod" />
        <TextField defaultValue={new Date().toISOString().slice(0, 10)} label="Fecha de pago de embalaje" name="packagingPaymentDate" required type="date" />
        <ModalActions onClose={onClose} pending={pending} submitLabel="Registrar embalaje" />
      </form>
    </ModalFrame>
  );
}

function ShipModal({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; pending: boolean }) {
  return (
    <ModalFrame onClose={onClose} title="Registrar envio">
      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700">Tipo de envio
          <select className="mt-1 h-10 w-full rounded-md border px-3" name="shippingType" required>
            <option value="MOTORIZED">Motorizado</option>
            <option value="COURIER">Courier</option>
          </select>
        </label>
        <TextField label="Proveedor" name="providerName" required />
        <TextField label="Tracking si es courier" name="trackingNumber" />
        <TextField label="Numero de envio si es motorizado" name="deliveryOrderNumber" />
        <ModalActions onClose={onClose} pending={pending} submitLabel="Registrar envio" />
      </form>
    </ModalFrame>
  );
}

function CloseModal({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; pending: boolean }) {
  return (
    <ModalFrame onClose={onClose} title="Cerrar pedido">
      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input name="customerPickupConfirmed" type="checkbox" /> Cliente recibio o recogio
        </label>
        <label className="block text-sm font-medium text-slate-700">Observacion
          <textarea className="mt-1 min-h-20 w-full rounded-md border px-3 py-2" name="observation" />
        </label>
        <ModalActions onClose={onClose} pending={pending} submitLabel="Cerrar pedido" />
      </form>
    </ModalFrame>
  );
}

function Timeline({ order }: { order: OrderDetail }) {
  const completed = new Set(order.history.map((item) => item.toStatus));
  if (order.status === "CLOSED") ORDER_STATUS_FLOW.forEach((status) => completed.add(status));

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Linea de tiempo</h2>
      <div className="mt-5 space-y-0">
        {order.history.map((item, index) => (
          <div className="relative grid grid-cols-[36px_1fr] gap-3 pb-5" key={item.id}>
            {index < order.history.length - 1 ? <span className="absolute left-[17px] top-9 h-full w-px bg-slate-200" /> : null}
            <span className={`z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border ${completed.has(item.toStatus) ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-400"}`}>
              <TimelineIcon status={item.toStatus} />
            </span>
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
              <p className="font-medium text-slate-900">{getOrderStatusLabel(item.toStatus)}</p>
              <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()} - {item.actorName ?? "Sistema"}</p>
              {item.reason ? <p className="mt-1 text-sm text-neutral-600">{item.reason}</p> : null}
              <TimelineMetadata order={order} status={item.toStatus} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function TimelineIcon({ status }: { status: OrderStatus }) {
  if (status === "CREATED" || status === "REGISTERED") return <FilePlus size={17} />;
  if (status === "PAID") return <CreditCard size={17} />;
  if (status === "PRODUCTS_INCOMPLETE") return <AlertTriangle size={17} />;
  if (status === "PRODUCTS_COMPLETE") return <PackageCheck size={17} />;
  if (status === "READY_TO_SHIP") return <PackageCheck size={17} />;
  if (status === "PACKAGING_PAID") return <CreditCard size={17} />;
  if (status === "SHIPPED") return <Truck size={17} />;
  if (status === "CLOSED") return <CheckCircle2 size={17} />;
  if (status === "OBSERVED") return <AlertTriangle size={17} />;
  if (status === "CANCELLED") return <XCircle size={17} />;
  return <Circle size={14} />;
}

function TimelineMetadata({ order, status }: { order: OrderDetail; status: OrderStatus }) {
  const rows: string[] = [];
  if (status === "PAID") {
    if (order.productPaymentAmount) rows.push(`Pago productos: S/ ${order.productPaymentAmount}`);
    if (order.scheduledShippingDate) rows.push(`Envio programado: ${new Date(order.scheduledShippingDate).toLocaleDateString()}`);
    if (order.packagingCost) rows.push(`Embalaje: S/ ${order.packagingCost}`);
  }
  if (status === "READY_TO_SHIP" && order.packagingPaymentAmount) rows.push(`Pago embalaje: S/ ${order.packagingPaymentAmount}`);
  if (status === "SHIPPED") {
    if (order.providerName) rows.push(`Proveedor: ${order.providerName}`);
    if (order.trackingNumber) rows.push(`Tracking: ${order.trackingNumber}`);
    if (order.deliveryOrderNumber) rows.push(`Numero envio: ${order.deliveryOrderNumber}`);
  }
  if (status === "CLOSED") {
    rows.push(order.customerReceivedConfirmed ? "Cliente recibio confirmado" : "Cliente pendiente");
    rows.push(order.carrierDeliveredConfirmed ? "Proveedor entrego confirmado" : "Proveedor pendiente");
  }
  if (!rows.length) return null;
  return <div className="mt-2 flex flex-wrap gap-2">{rows.map((row) => <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600" key={row}>{row}</span>)}</div>;
}
