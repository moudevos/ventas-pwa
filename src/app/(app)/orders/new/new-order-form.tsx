"use client";

import { FileText, IdCard, PackagePlus, Search, Trash2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonSpinner } from "@/components/loading";
import { showError, showToast } from "@/lib/alerts";
import { api, type ClientDto } from "@/lib/api-client";

const UBIGEO = {
  Amazonas: {
    Chachapoyas: ["Chachapoyas"],
    Bagua: ["Bagua"],
    Utcubamba: ["Bagua Grande"],
  },
  Ancash: {
    Huaraz: ["Huaraz"],
    Santa: ["Chimbote", "Nuevo Chimbote"],
  },
  Apurimac: {
    Abancay: ["Abancay"],
    Andahuaylas: ["Andahuaylas"],
  },
  Arequipa: {
    Arequipa: ["Cercado", "Cayma", "Yanahuara"],
    Camana: ["Camana"],
  },
  Ayacucho: {
    Huamanga: ["Ayacucho"],
    Huanta: ["Huanta"],
  },
  Cajamarca: {
    Cajamarca: ["Cajamarca"],
    Jaen: ["Jaen"],
  },
  Callao: {
    Callao: ["Callao", "Bellavista", "La Perla", "Ventanilla"],
  },
  Cusco: {
    Cusco: ["Cusco", "Wanchaq", "San Sebastian"],
  },
  Huancavelica: {
    Huancavelica: ["Huancavelica"],
  },
  Huanuco: {
    Huanuco: ["Huanuco", "Amarilis"],
  },
  Ica: {
    Ica: ["Ica"],
    Chincha: ["Chincha Alta"],
    Pisco: ["Pisco"],
  },
  Junin: {
    Huancayo: ["Huancayo", "El Tambo"],
    Tarma: ["Tarma"],
  },
  "La Libertad": {
    Trujillo: ["Trujillo", "La Esperanza", "Victor Larco Herrera"],
  },
  Lambayeque: {
    Chiclayo: ["Chiclayo", "Jose Leonardo Ortiz", "La Victoria"],
  },
  Lima: {
    Lima: ["Miraflores", "San Isidro", "Santiago de Surco", "Los Olivos"],
    Huaral: ["Huaral", "Chancay"],
  },
  Loreto: {
    Maynas: ["Iquitos", "Punchana", "Belen"],
  },
  "Madre de Dios": {
    Tambopata: ["Puerto Maldonado"],
  },
  Moquegua: {
    Mariscal: ["Moquegua"],
    Ilo: ["Ilo"],
  },
  Pasco: {
    Pasco: ["Cerro de Pasco"],
  },
  Piura: {
    Piura: ["Piura", "Castilla"],
    Sullana: ["Sullana"],
  },
  Puno: {
    Puno: ["Puno"],
    SanRoman: ["Juliaca"],
  },
  "San Martin": {
    SanMartin: ["Tarapoto"],
    Moyobamba: ["Moyobamba"],
  },
  Tacna: {
    Tacna: ["Tacna"],
  },
  Tumbes: {
    Tumbes: ["Tumbes"],
  },
  Ucayali: {
    CoronelPortillo: ["Pucallpa", "Yarinacocha"],
  },
} as const;

type Department = keyof typeof UBIGEO;
type ClientForm = {
  documentType: "DNI" | "CEX";
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  department: Department | "";
  province: string;
  district: string;
  deliveryAddress: string;
  reference: string;
};
type ProductDto = { id: string; sku: string; description: string; basePrice?: string; defaultUnitPrice?: string; stockOnHand: number; stockReserved: number };
type OrderItemForm = { sku: string; description: string; quantity: number; unitPrice: number; productId?: string; stockAvailable?: number };

const emptyClient: ClientForm = {
  documentType: "DNI",
  documentNumber: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  department: "",
  province: "",
  district: "",
  deliveryAddress: "",
  reference: "",
};

function isDepartment(value: string | null | undefined): value is Department {
  return Boolean(value && Object.prototype.hasOwnProperty.call(UBIGEO, value));
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function NewOrderForm() {
  const router = useRouter();
  const [client, setClient] = useState<ClientForm>(emptyClient);
  const [clientLoaded, setClientLoaded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<OrderItemForm[]>([]);
  const [observations, setObservations] = useState("");
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const departmentData = isDepartment(client.department) ? UBIGEO[client.department] : null;
  const provinces = departmentData ? Object.keys(departmentData) : [];
  const districts = departmentData && client.province && Object.prototype.hasOwnProperty.call(departmentData, client.province)
    ? departmentData[client.province as keyof typeof departmentData]
    : [];

  function patchClient(patch: Partial<ClientForm>) {
    setClient((current) => ({ ...current, ...patch }));
  }

  async function findClient() {
    setSearching(true);
    try {
      const rows = await api.get<ClientDto[]>(`/api/clients/find?documentType=${client.documentType}&documentNumber=${encodeURIComponent(client.documentNumber)}`);
      const found = rows[0];
      if (found) {
        const foundDepartment = isDepartment(found.department) ? found.department : "";
        const foundProvince = foundDepartment && found.province && Object.prototype.hasOwnProperty.call(UBIGEO[foundDepartment], found.province)
          ? found.province
          : "";
        const foundDistricts = foundDepartment && foundProvince ? UBIGEO[foundDepartment][foundProvince as keyof (typeof UBIGEO)[typeof foundDepartment]] : [];
        setClient({
          documentType: found.documentType ?? client.documentType,
          documentNumber: found.documentId ?? client.documentNumber,
          firstName: found.firstName ?? "",
          lastName: found.lastName ?? "",
          phone: found.phone ?? "",
          email: found.email ?? "",
          department: foundDepartment,
          province: foundProvince,
          district: found.district && (foundDistricts as readonly string[]).includes(found.district) ? found.district : "",
          deliveryAddress: found.address ?? "",
          reference: found.deliveryReference ?? "",
        });
        await showToast("Cliente encontrado");
      } else {
        setClientLoaded(true);
        await showToast("Cliente nuevo, completa sus datos", "info");
      }
      setClientLoaded(true);
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo buscar cliente");
    } finally {
      setSearching(false);
    }
  }

  async function createOrder() {
    if (!clientLoaded) {
      await showError("Busca o completa un cliente valido antes de crear el pedido.");
      return;
    }
    setSaving(true);
    try {
      const clientName = `${client.firstName} ${client.lastName}`.trim();
      const order = await api.post<{ id: string }>("/api/orders", {
        client: {
          documentType: client.documentType,
          documentNumber: client.documentNumber.trim(),
          firstName: optionalText(client.firstName),
          lastName: optionalText(client.lastName),
          name: clientName || client.documentNumber.trim(),
          phone: optionalText(client.phone),
          email: optionalText(client.email),
          department: optionalText(client.department),
          province: optionalText(client.province),
          district: optionalText(client.district),
          deliveryAddress: optionalText(client.deliveryAddress),
          reference: optionalText(client.reference),
        },
        shippingAddress: optionalText(client.deliveryAddress),
        deliveryReference: optionalText(client.reference),
        orderDetails: items.map((item) => `${item.quantity} x ${item.sku} - ${item.description}`).join("\n"),
        totalAmount,
        items,
        observations: optionalText(observations),
      });
      await showToast("Pedido creado");
      router.push(`/orders/${order.id}`);
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo crear pedido");
    } finally {
      setSaving(false);
    }
  }

  function patchItem(index: number, patch: Partial<OrderItemForm>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function fillProduct(index: number) {
    const sku = items[index]?.sku.trim();
    if (!sku) return;
    const rows = await api.get<ProductDto[]>(`/api/products?search=${encodeURIComponent(sku)}`);
    const product = rows.find((row) => row.sku.toLowerCase() === sku.toLowerCase()) ?? rows[0];
    if (!product) return;
    patchItem(index, {
      productId: product.id,
      sku: product.sku,
      description: product.description,
      unitPrice: Number(product.basePrice ?? product.defaultUnitPrice ?? 0),
      stockAvailable: product.stockOnHand - product.stockReserved,
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <IdCard size={20} />
          <h2 className="font-semibold">1. Buscar cliente</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_auto]">
          <label className="text-sm font-medium">Tipo de doc
            <select className="mt-1 h-10 w-full rounded-md border px-3" value={client.documentType} onChange={(e) => patchClient({ documentType: e.target.value as "DNI" | "CEX" })}>
              <option value="DNI">DNI</option>
              <option value="CEX">CEX</option>
            </select>
          </label>
          <label className="text-sm font-medium">Documento
            <input className="mt-1 h-10 w-full rounded-md border px-3" value={client.documentNumber} onChange={(e) => patchClient({ documentNumber: e.target.value })} />
          </label>
          <button className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-white disabled:opacity-60" disabled={searching || !client.documentNumber} onClick={findClient} type="button">
            {searching ? <ButtonSpinner /> : <Search size={17} />} Buscar cliente
          </button>
        </div>
      </section>

      {clientLoaded ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <UserCheck size={20} />
            <h2 className="font-semibold">2. Datos de cliente</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Nombre" value={client.firstName} onChange={(v) => patchClient({ firstName: v })} />
            <Field label="Apellido" value={client.lastName} onChange={(v) => patchClient({ lastName: v })} />
            <Field label="Telefono" value={client.phone} onChange={(v) => patchClient({ phone: v })} />
            <Field label="Correo" value={client.email} onChange={(v) => patchClient({ email: v })} />
            <SelectField label="Departamento" value={client.department} options={Object.keys(UBIGEO)} onChange={(v) => patchClient({ department: v as Department, province: "", district: "" })} />
            <SelectField label="Provincia" value={client.province} options={provinces} onChange={(v) => patchClient({ province: v, district: "" })} />
            <SelectField label="Distrito" value={client.district} options={districts as string[]} onChange={(v) => patchClient({ district: v })} />
            <Field label="Direccion de entrega" value={client.deliveryAddress} onChange={(v) => patchClient({ deliveryAddress: v })} />
            <Field label="Referencia" value={client.reference} onChange={(v) => patchClient({ reference: v })} className="md:col-span-2" />
          </div>
        </section>
      ) : null}

      {clientLoaded ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <h2 className="font-semibold">3. Pedido</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Prendas / productos</h3>
                <button className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-3 text-sm text-white" onClick={() => setItems((current) => [...current, { sku: "", description: "", quantity: 1, unitPrice: 0 }])} type="button">
                  <PackagePlus size={16} /> Agregar
                </button>
              </div>
              <div className="mt-3 grid gap-3">
                {items.map((item, index) => (
                  <div className="grid gap-2 rounded-md bg-slate-50 p-3 md:grid-cols-[120px_1fr_90px_120px_90px_40px]" key={index}>
                    <input className="h-10 rounded-md border px-3" placeholder="SKU" value={item.sku} onBlur={() => void fillProduct(index).catch((err) => void showError(err.message))} onChange={(e) => patchItem(index, { sku: e.target.value })} />
                    <input className="h-10 rounded-md border px-3" placeholder="Descripcion" value={item.description} onChange={(e) => patchItem(index, { description: e.target.value })} />
                    <input className="h-10 rounded-md border px-3" min="1" type="number" value={item.quantity} onChange={(e) => patchItem(index, { quantity: Number(e.target.value || 1) })} />
                    <input className="h-10 rounded-md border px-3" min="0" step="0.01" type="number" value={item.unitPrice} onChange={(e) => patchItem(index, { unitPrice: Number(e.target.value || 0) })} />
                    <span className={`flex h-10 items-center text-xs ${item.stockAvailable !== undefined && item.stockAvailable < item.quantity ? "text-amber-700" : "text-slate-500"}`}>Stock: {item.stockAvailable ?? "-"}</span>
                    <button className="flex h-10 items-center justify-center rounded-md border text-rose-600" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-right text-lg font-semibold">Total: S/ {totalAmount.toFixed(2)}</p>
            </div>
            <label className="text-sm font-medium">Observaciones
              <textarea className="mt-1 min-h-20 w-full rounded-md border px-3 py-2" value={observations} onChange={(e) => setObservations(e.target.value)} />
            </label>
            <button className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-neutral-950 px-4 text-white disabled:opacity-60" disabled={saving || !items.length || totalAmount <= 0} onClick={createOrder} type="button">
              {saving ? <ButtonSpinner /> : null} Guardar pedido
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({ className = "", label, onChange, value }: { className?: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={`text-sm font-medium ${className}`}>{label}
      <input className="mt-1 h-10 w-full rounded-md border px-3" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SelectField({ label, onChange, options, value }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">{label}
      <select className="mt-1 h-10 w-full rounded-md border px-3" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleccionar</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
