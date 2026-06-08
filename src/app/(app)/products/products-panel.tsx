"use client";

import { Boxes, PackagePlus, Pencil, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

import { ButtonSpinner, PageLoader } from "@/components/loading";
import { showError, showToast } from "@/lib/alerts";
import { api } from "@/lib/api-client";

type Product = {
  id: string;
  sku: string;
  description: string;
  defaultUnitPrice: string;
  basePrice: string;
  stockOnHand: number;
  stockReserved: number;
  minStock: number;
  status: "active" | "inactive";
};

export function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockModal, setStockModal] = useState<{ product: Product; type: "in" | "adjust" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pending, setPending] = useState(false);

  async function load(q = search) {
    setProducts(await api.get<Product[]>(`/api/products${q ? `?search=${encodeURIComponent(q)}` : ""}`));
  }

  useEffect(() => {
    void api.get<Product[]>("/api/products").then(setProducts).catch((err) => void showError(err.message)).finally(() => setLoading(false));
    void fetch("/api/auth/session").then((r) => r.ok ? r.json() : null).then((s) => { if (s && s.role === "admin") setIsAdmin(true); }).catch(() => { });
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const basePrice = Number(form.get("basePrice") || 0);
    const payload = {
      sku: form.get("sku"),
      description: form.get("description"),
      defaultUnitPrice: basePrice,
      basePrice,
      minStock: Number(form.get("minStock") || 0),
      status: form.get("status"),
      ...(!editing ? { stockOnHand: Number(form.get("stockOnHand") || 0) } : {}),
    };
    try {
      if (editing) {
        await api.patch(`/api/products/${editing.id}`, payload);
        await showToast("Producto actualizado.");
      } else {
        await api.post("/api/products", payload);
        await showToast("Producto creado.");
      }
      event.currentTarget.reset();
      setEditing(null);
      setModalOpen(false);
      await load("");
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo guardar producto");
    } finally {
      setPending(false);
    }
  }

  async function submitStock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stockModal) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      if (stockModal.type === "in") {
        const quantity = Number(form.get("quantity") || 0);
        if (quantity <= 0) {
          await showError("Ingresa una cantidad valida.");
          return;
        }
        await api.post(`/api/products/${stockModal.product.id}/stock-in`, {
          quantity,
          reason: form.get("reason") || undefined,
        });
        await showToast("Stock ingresado.");
      } else {
        const stockOnHand = Number(form.get("stockOnHand") || 0);
        const reason = String(form.get("reason") || "");
        if (!reason) {
          await showError("Ingresa motivo del ajuste.");
          return;
        }
        await api.post(`/api/products/${stockModal.product.id}/adjust-stock`, { stockOnHand, reason });
        await showToast("Stock ajustado.");
      }
      setStockModal(null);
      await load();
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo actualizar stock");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Productos</h2>
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-indigo-600 px-4 text-white" onClick={() => { setEditing(null); setModalOpen(true); }} type="button">
          <Boxes size={17} /> Nuevo producto
        </button>
      </div>
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl" onSubmit={save}>
            <div className="flex items-center gap-2">
              <Boxes size={20} />
              <h2 className="font-semibold">{editing ? "Editar producto" : "Crear producto"}</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <Field label="SKU" name="sku" defaultValue={editing?.sku} placeholder="VEST-R-001-M" required />
              <Field label="Descripcion" name="description" defaultValue={editing?.description} placeholder="Descripcion de la prenda" required />
              {!editing ? <Field label="Stock fisico inicial" name="stockOnHand" defaultValue={0} min="0" placeholder="0" type="number" /> : null}
              <Field label="Precio base" name="basePrice" defaultValue={editing?.basePrice ?? editing?.defaultUnitPrice} min="0" placeholder="0.00" step="0.01" type="number" required />
              <input name="defaultUnitPrice" type="hidden" value={editing?.defaultUnitPrice ?? editing?.basePrice ?? ""} />
              <Field label="Stock minimo" name="minStock" defaultValue={editing?.minStock ?? 0} min="0" placeholder="0" type="number" />
              <label className="block text-sm font-medium text-slate-700">Estado
                <select className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={editing?.status ?? "active"} name="status">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="h-10 rounded-md border px-4" disabled={pending} onClick={() => { setModalOpen(false); setEditing(null); }} type="button">Cancelar</button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-indigo-600 px-4 text-white disabled:opacity-60" disabled={pending} type="submit">
                {pending ? <ButtonSpinner /> : null} {pending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <form className="flex h-12 items-center border-b px-4" onSubmit={(event) => { event.preventDefault(); void load(search); }}>
          <Search className="mr-2 text-neutral-400" size={17} />
          <input className="min-w-0 flex-1 outline-none" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto" value={search} />
        </form>
        {loading ? <PageLoader label="Cargando productos..." /> : <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Descripcion</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-medium">{product.sku}</td>
                <td className="px-4 py-3">{product.description}</td>
                <td className="px-4 py-3">S/ {product.defaultUnitPrice}</td>
                <td className="px-4 py-3">
                  <span className="block">Fisico: {product.stockOnHand}</span>
                  <span className="block text-xs text-slate-500">Reservado: {product.stockReserved} / Disponible: {product.stockOnHand - product.stockReserved} / Min: {product.minStock}</span>
                </td>
                <td className="px-4 py-3">{product.status}</td>
                <td className="flex gap-2 px-4 py-3">
                  {isAdmin ? (
                    <>
                      <button className="inline-flex items-center gap-1 rounded-md border px-3 py-2" onClick={() => { setEditing(product); setModalOpen(true); }} type="button">
                        <Pencil size={15} /> Editar
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border px-3 py-2" onClick={() => setStockModal({ product, type: "in" })} type="button">
                        <PackagePlus size={15} /> Ingreso
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border px-3 py-2" onClick={() => setStockModal({ product, type: "adjust" })} type="button">
                        <SlidersHorizontal size={15} /> Ajuste
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">Sin permisos</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </section>
      {stockModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl" onSubmit={submitStock}>
            <h2 className="text-lg font-semibold">{stockModal.type === "in" ? "Ingreso de stock" : "Ajuste de stock"}</h2>
            <p className="mt-1 text-sm text-slate-500">{stockModal.product.sku} - {stockModal.product.description}</p>
            <div className="mt-4 grid gap-3">
              {stockModal.type === "in" ? (
                <Field label="Cantidad a ingresar" name="quantity" min="1" placeholder="0" type="number" required />
              ) : (
                <Field label="Nuevo stock fisico" name="stockOnHand" defaultValue={stockModal.product.stockOnHand} min="0" placeholder="0" type="number" required />
              )}
              <Field label={stockModal.type === "in" ? "Motivo" : "Motivo obligatorio"} name="reason" required={stockModal.type === "adjust"} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="h-10 rounded-md border px-4" disabled={pending} onClick={() => setStockModal(null)} type="button">Cancelar</button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-indigo-600 px-4 text-white disabled:opacity-60" disabled={pending} type="submit">
                {pending ? <ButtonSpinner /> : null} {pending ? "Procesando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  defaultValue,
  label,
  min,
  name,
  placeholder,
  required,
  step,
  type = "text",
}: {
  defaultValue?: number | string;
  label: string;
  min?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">{label}
      <input className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={defaultValue} min={min} name={name} placeholder={placeholder} required={required} step={step} type={type} />
    </label>
  );
}
