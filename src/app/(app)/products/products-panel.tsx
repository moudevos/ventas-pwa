"use client";

import { Boxes, EllipsisVertical, PackagePlus, Pencil, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductImage, ProductImageUploader, uploadProductImage } from "@/components/product-image";
import { AppBadge, AppButton, AppCard, AppModal, PageLoader, ResponsiveTable } from "@/components/ui/app-ui";
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
  primaryImageUrl?: string | null;
  status: "active" | "inactive";
};

type Role = "admin" | "promoter";
type ImageDraft = { file: File | null; previewUrl: string | null; remove: boolean };

const emptyImageDraft: ImageDraft = { file: null, previewUrl: null, remove: false };

export function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockModal, setStockModal] = useState<{ product: Product; type: "in" | "adjust" } | null>(null);
  const [imageDraft, setImageDraft] = useState<ImageDraft>(emptyImageDraft);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("promoter");
  const [pending, setPending] = useState(false);

  const canManageProducts = role === "admin";
  const canManageStock = role === "admin";

  const load = useCallback(async (q = search) => {
    const rows = await api.get<Product[]>(`/api/products${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    setProducts(rows);
  }, [search]);

  useEffect(() => {
    void Promise.all([
      api.get<Product[]>("/api/products").then(setProducts),
      fetch("/api/auth/session", { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then((session) => {
          if (session?.role === "admin" || session?.role === "promoter") setRole(session.role);
        }),
    ]).catch((err) => void showError(err.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load(search).catch((err) => void showError(err.message));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [load, search]);

  function openCreate() {
    setEditing(null);
    setImageDraft(emptyImageDraft);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setImageDraft({ file: null, previewUrl: product.primaryImageUrl ?? null, remove: false });
    setModalOpen(true);
  }

  function closeProductModal() {
    if (pending) return;
    setModalOpen(false);
    setEditing(null);
    setImageDraft(emptyImageDraft);
  }

  async function refreshAfterSave() {
    try {
      await load(search);
    } catch {
      await showToast("Producto guardado. Actualiza la lista si no ves el cambio.", "info");
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const form = new FormData(event.currentTarget);
    const basePrice = Number(form.get("basePrice") || 0);
    const payload = {
      sku: String(form.get("sku") || "").trim(),
      description: String(form.get("description") || "").trim(),
      defaultUnitPrice: basePrice,
      basePrice,
      minStock: Number(form.get("minStock") || 0),
      primaryImageUrl: imageDraft.remove ? null : editing?.primaryImageUrl ?? null,
      status: String(form.get("status") || "active"),
      ...(!editing ? { stockOnHand: Number(form.get("stockOnHand") || 0) } : {}),
    };
    try {
      let saved: Product;
      if (editing) {
        saved = await api.patch<Product>(`/api/products/${editing.id}`, payload);
      } else {
        saved = await api.post<Product>("/api/products", payload);
      }

      if (imageDraft.file && !imageDraft.remove) {
        const uploaded = await uploadProductImage(imageDraft.file, saved.id);
        saved = { ...saved, primaryImageUrl: uploaded.publicUrl };
      }

      setProducts((rows) => {
        const exists = rows.some((product) => product.id === saved.id);
        return exists ? rows.map((product) => product.id === saved.id ? saved : product) : [saved, ...rows];
      });
      await showToast(editing ? "Producto actualizado." : "Producto creado.");
      closeProductModal();
      await refreshAfterSave();
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo guardar producto");
    } finally {
      setPending(false);
    }
  }

  async function submitStock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stockModal || pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      if (stockModal.type === "in") {
        const quantity = Number(form.get("quantity") || 0);
        if (quantity <= 0) throw new Error("Ingresa una cantidad valida.");
        await api.post(`/api/products/${stockModal.product.id}/stock-in`, {
          quantity,
          reason: form.get("reason") || undefined,
        });
        await showToast("Stock ingresado.");
      } else {
        const stockOnHand = Number(form.get("stockOnHand") || 0);
        const reason = String(form.get("reason") || "");
        if (!reason) throw new Error("Ingresa motivo del ajuste.");
        await api.post(`/api/products/${stockModal.product.id}/adjust-stock`, { stockOnHand, reason });
        await showToast("Stock ajustado.");
      }
      setStockModal(null);
      await refreshAfterSave();
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo actualizar stock");
    } finally {
      setPending(false);
    }
  }

  const visibleProducts = useMemo(() => products, [products]);

  if (loading) return <PageLoader label="Cargando productos..." />;

  return (
    <section className="mt-4 space-y-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-slate-200 bg-slate-100/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Productos</h2>
            <p className="text-xs text-slate-500">{visibleProducts.length} productos visibles</p>
          </div>
          {canManageProducts ? (
            <AppButton className="px-3" onClick={openCreate} type="button">
              <Boxes size={17} /> Nuevo
            </AppButton>
          ) : null}
        </div>
        <form className="mt-3 flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm" onSubmit={(event) => { event.preventDefault(); void load(search); }}>
          <Search className="mr-2 shrink-0 text-slate-400" size={17} />
          <input className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar SKU o descripcion" value={search} />
        </form>
      </div>

      <div className="grid gap-3 md:hidden">
        {visibleProducts.map((product) => (
          <ProductCard canManageProducts={canManageProducts} canManageStock={canManageStock} key={product.id} onAdjust={() => setStockModal({ product, type: "adjust" })} onEdit={() => openEdit(product)} onStockIn={() => setStockModal({ product, type: "in" })} product={product} />
        ))}
      </div>

      <AppCard className="hidden overflow-hidden md:block">
        <ResponsiveTable>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage alt={product.sku} className="h-14 w-14 rounded-lg border border-slate-200" src={product.primaryImageUrl} />
                      <div className="min-w-0">
                        <p className="font-medium">{product.sku}</p>
                        <p className="truncate text-slate-500">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">S/ {product.basePrice ?? product.defaultUnitPrice}</td>
                  <td className="px-4 py-3"><StockBlock product={product} /></td>
                  <td className="px-4 py-3"><AppBadge tone={product.status === "active" ? "emerald" : "slate"}>{product.status}</AppBadge></td>
                  <td className="px-4 py-3">
                    <ProductActions canManageProducts={canManageProducts} canManageStock={canManageStock} onAdjust={() => setStockModal({ product, type: "adjust" })} onEdit={() => openEdit(product)} onStockIn={() => setStockModal({ product, type: "in" })} product={product} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      </AppCard>

      {modalOpen ? (
        <AppModal onClose={closeProductModal} title={editing ? "Editar producto" : "Crear producto"}>
          <form className="grid gap-4" onSubmit={save}>
            <ProductImageUploader key={editing?.id ?? "new"} currentUrl={editing?.primaryImageUrl} disabled={pending} onChange={setImageDraft} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="SKU" name="sku" defaultValue={editing?.sku} placeholder="VEST-R-001-M" required />
              <Field label="Precio base" name="basePrice" defaultValue={editing?.basePrice ?? editing?.defaultUnitPrice} min="0" placeholder="0.00" step="0.01" type="number" required />
              <Field className="sm:col-span-2" label="Descripcion" name="description" defaultValue={editing?.description} placeholder="Descripcion de la prenda" required />
              {!editing ? <Field label="Stock fisico inicial" name="stockOnHand" defaultValue={0} min="0" placeholder="0" type="number" /> : null}
              <Field label="Stock minimo" name="minStock" defaultValue={editing?.minStock ?? 0} min="0" placeholder="0" type="number" />
              <label className="block text-sm font-medium text-slate-700">Estado
                <select className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3" defaultValue={editing?.status ?? "active"} name="status">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>
            </div>
            <div className="sticky bottom-0 -mx-4 mt-2 flex justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
              <AppButton disabled={pending} onClick={closeProductModal} tone="secondary" type="button">Cancelar</AppButton>
              <AppButton pending={pending} type="submit">{pending ? "Guardando..." : "Guardar"}</AppButton>
            </div>
          </form>
        </AppModal>
      ) : null}

      {stockModal ? (
        <AppModal onClose={() => { if (!pending) setStockModal(null); }} title={stockModal.type === "in" ? "Ingreso de stock" : "Ajuste de stock"}>
          <form className="grid gap-4" onSubmit={submitStock}>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <ProductImage alt={stockModal.product.sku} className="h-14 w-14 rounded-lg border border-slate-200" src={stockModal.product.primaryImageUrl} />
              <div>
                <p className="font-medium">{stockModal.product.sku}</p>
                <p className="text-sm text-slate-500">{stockModal.product.description}</p>
              </div>
            </div>
            {stockModal.type === "in" ? (
              <Field label="Cantidad a ingresar" name="quantity" min="1" placeholder="0" type="number" required />
            ) : (
              <Field label="Nuevo stock fisico" name="stockOnHand" defaultValue={stockModal.product.stockOnHand} min="0" placeholder="0" type="number" required />
            )}
            <Field label={stockModal.type === "in" ? "Motivo" : "Motivo obligatorio"} name="reason" required={stockModal.type === "adjust"} />
            <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
              <AppButton disabled={pending} onClick={() => setStockModal(null)} tone="secondary" type="button">Cancelar</AppButton>
              <AppButton pending={pending} type="submit">{pending ? "Procesando..." : "Guardar"}</AppButton>
            </div>
          </form>
        </AppModal>
      ) : null}
    </section>
  );
}

function ProductCard({ canManageProducts, canManageStock, onAdjust, onEdit, onStockIn, product }: { canManageProducts: boolean; canManageStock: boolean; onAdjust: () => void; onEdit: () => void; onStockIn: () => void; product: Product }) {
  return (
    <AppCard className="p-3">
      <div className="flex gap-3">
        <ProductImage alt={product.sku} className="h-24 w-24 shrink-0 rounded-xl border border-slate-200" src={product.primaryImageUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{product.sku}</p>
              <p className="line-clamp-2 text-sm text-slate-500">{product.description}</p>
            </div>
            <details className="relative">
              <summary className="grid h-9 w-9 list-none place-items-center rounded-lg border border-slate-200 text-slate-500">
                <EllipsisVertical size={17} />
              </summary>
              <div className="absolute right-0 z-10 mt-1 grid w-44 gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-lg">
                {canManageProducts ? <button className="rounded-md px-3 py-2 text-left hover:bg-slate-50" onClick={onEdit} type="button"><Pencil size={15} className="mr-2 inline" /> Editar</button> : null}
                {canManageStock ? <button className="rounded-md px-3 py-2 text-left hover:bg-slate-50" onClick={onStockIn} type="button"><PackagePlus size={15} className="mr-2 inline" /> Ingreso</button> : null}
                {canManageStock ? <button className="rounded-md px-3 py-2 text-left hover:bg-slate-50" onClick={onAdjust} type="button"><SlidersHorizontal size={15} className="mr-2 inline" /> Ajuste</button> : null}
                <Link className="rounded-md px-3 py-2 hover:bg-slate-50" href={`/kardex?productId=${product.id}`}>Kardex</Link>
              </div>
            </details>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="font-semibold">S/ {product.basePrice ?? product.defaultUnitPrice}</span>
            <StockBadge product={product} />
          </div>
        </div>
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <StockBlock product={product} />
      </div>
    </AppCard>
  );
}

function ProductActions({ canManageProducts, canManageStock, onAdjust, onEdit, onStockIn, product }: { canManageProducts: boolean; canManageStock: boolean; onAdjust: () => void; onEdit: () => void; onStockIn: () => void; product: Product }) {
  return (
    <div className="flex flex-wrap gap-2">
      {canManageProducts ? <AppButton className="min-h-10 px-3" onClick={onEdit} tone="secondary" type="button"><Pencil size={15} /> Editar</AppButton> : null}
      {canManageStock ? <AppButton className="min-h-10 px-3" onClick={onStockIn} tone="secondary" type="button"><PackagePlus size={15} /> Ingreso</AppButton> : null}
      {canManageStock ? <AppButton className="min-h-10 px-3" onClick={onAdjust} tone="secondary" type="button"><SlidersHorizontal size={15} /> Ajuste</AppButton> : null}
      <Link className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium hover:bg-slate-50" href={`/kardex?productId=${product.id}`}>Kardex</Link>
    </div>
  );
}

function StockBlock({ product }: { product: Product }) {
  const available = product.stockOnHand - product.stockReserved;
  return (
    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
      <span><strong className="block text-sm text-slate-900">{product.stockOnHand}</strong>Fisico</span>
      <span><strong className="block text-sm text-slate-900">{product.stockReserved}</strong>Reservado</span>
      <span><strong className="block text-sm text-slate-900">{available}</strong>Disponible</span>
      <span className="col-span-3"><StockBadge product={product} /></span>
    </div>
  );
}

function StockBadge({ product }: { product: Product }) {
  const available = product.stockOnHand - product.stockReserved;
  const low = available <= product.minStock;
  return <AppBadge tone={low ? "rose" : "emerald"}>{low ? "Stock bajo" : `Min ${product.minStock}`}</AppBadge>;
}

function Field({
  className = "",
  defaultValue,
  label,
  min,
  name,
  placeholder,
  required,
  step,
  type = "text",
}: {
  className?: string;
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
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>{label}
      <input className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3" defaultValue={defaultValue} min={min} name={name} placeholder={placeholder} required={required} step={step} type={type} />
    </label>
  );
}
