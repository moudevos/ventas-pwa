"use client";

import { PackagePlus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

import { ButtonSpinner } from "@/components/loading";
import { showError, showToast } from "@/lib/alerts";
import { api } from "@/lib/api-client";

type Product = { id: string; sku: string; description: string; basePrice?: string; defaultUnitPrice?: string; stockOnHand: number; stockReserved: number };
type Item = { productId: string; sku: string; description: string; quantity: number; unitPrice: number; stockAvailable: number };

export function StoreSalePanel() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [saving, setSaving] = useState(false);
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  async function searchProducts() {
    setResults(await api.get<Product[]>(`/api/products?search=${encodeURIComponent(search)}`));
  }

  function addProduct(product: Product) {
    const stockAvailable = product.stockOnHand - product.stockReserved;
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, {
        productId: product.id,
        sku: product.sku,
        description: product.description,
        quantity: 1,
        unitPrice: Number(product.basePrice ?? product.defaultUnitPrice ?? 0),
        stockAvailable,
      }];
    });
  }

  function patchItem(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function save() {
    setSaving(true);
    try {
      await api.post("/api/sales", { paymentMethod, items });
      await showToast("Venta registrada");
      setItems([]);
      setResults([]);
      setSearch("");
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo registrar venta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="flex h-11 items-center gap-2" onSubmit={(event) => { event.preventDefault(); void searchProducts().catch((err) => void showError(err.message)); }}>
          <Search size={18} />
          <input className="h-10 min-w-0 flex-1 rounded-md border px-3" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar SKU o descripcion" value={search} />
          <button className="h-10 rounded-md bg-indigo-600 px-4 text-white" type="submit">Buscar</button>
        </form>
        <div className="mt-4 grid gap-2">
          {results.map((product) => (
            <button className="rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50" key={product.id} onClick={() => addProduct(product)} type="button">
              <span className="block font-medium">{product.sku}</span>
              <span className="block text-sm text-slate-500">{product.description}</span>
              <span className="mt-1 block text-xs text-slate-500">Disponible: {product.stockOnHand - product.stockReserved} | S/ {product.basePrice ?? product.defaultUnitPrice}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Detalle de venta</h2>
          <span className="text-xl font-semibold">S/ {total.toFixed(2)}</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500"><tr><th>SKU</th><th>Cant.</th><th>Precio</th><th>Subtotal</th><th /></tr></thead>
            <tbody>
              {items.map((item, index) => (
                <tr className="border-t" key={item.productId}>
                  <td className="py-3">
                    <p className="font-medium">{item.sku}</p>
                    <p className={`text-xs ${item.quantity > item.stockAvailable ? "text-rose-600" : "text-slate-500"}`}>Disponible: {item.stockAvailable}</p>
                  </td>
                  <td><input className="h-9 w-20 rounded-md border px-2" min="1" type="number" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value || 1) })} /></td>
                  <td><input className="h-9 w-24 rounded-md border px-2" min="0" step="0.01" type="number" value={item.unitPrice} onChange={(event) => patchItem(index, { unitPrice: Number(event.target.value || 0) })} /></td>
                  <td>S/ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                  <td><button className="rounded-md border p-2 text-rose-600" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="mt-4 block text-sm font-medium">Medio de pago
          <select className="mt-1 h-10 w-full rounded-md border px-3" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="YAPE">Yape</option>
            <option value="PLIN">Plin</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </label>
        <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-white disabled:opacity-60" disabled={saving || !items.length} onClick={save} type="button">
          {saving ? <ButtonSpinner /> : <PackagePlus size={17} />} Registrar venta
        </button>
      </section>
    </div>
  );
}
