"use client";

type Product = {
  id: string;
  sku: string;
  description: string;
  stockOnHand: number;
  stockReserved: number;
  minStock: number;
  updatedAt: Date;
};

export function InventoryPrintPanel({ products }: { products: Product[] }) {
  function exportCsv() {
    const header = ["sku", "descripcion", "fisico", "reservado", "disponible", "minimo", "actualizado", "conteo_manual", "observaciones"];
    const rows = products.map((product) => [
      product.sku,
      product.description,
      product.stockOnHand,
      product.stockReserved,
      product.stockOnHand - product.stockReserved,
      product.minStock,
      new Date(product.updatedAt).toLocaleString(),
      "",
      "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:mt-0 print:border-0 print:p-0 print:shadow-none">
      <style jsx global>{`
        @media print {
          aside, nav, .print\\:hidden { display: none !important; }
          main { padding-left: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="mb-4 flex gap-2 print:hidden">
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-white" onClick={() => window.print()} type="button">Imprimir inventario</button>
        <button className="rounded-md border px-4 py-2" onClick={exportCsv} type="button">Exportar CSV</button>
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="p-2">SKU</th>
            <th className="p-2">Descripcion</th>
            <th className="p-2">Fisico</th>
            <th className="p-2">Reservado</th>
            <th className="p-2">Disponible</th>
            <th className="p-2">Minimo</th>
            <th className="p-2">Actualizado</th>
            <th className="p-2">Conteo manual</th>
            <th className="p-2">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr className="border-b" key={product.id}>
              <td className="p-2 font-medium">{product.sku}</td>
              <td className="p-2">{product.description}</td>
              <td className="p-2">{product.stockOnHand}</td>
              <td className="p-2">{product.stockReserved}</td>
              <td className="p-2">{product.stockOnHand - product.stockReserved}</td>
              <td className="p-2">{product.minStock}</td>
              <td className="p-2">{new Date(product.updatedAt).toLocaleDateString()}</td>
              <td className="p-2">&nbsp;</td>
              <td className="p-2">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
