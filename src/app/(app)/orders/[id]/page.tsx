import { OrderDetail } from "./order-detail";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section>
      <h1 className="text-2xl font-semibold">Detalle operativo</h1>
      <p className="mt-2 text-sm text-neutral-600">Pedido {id}</p>
      <OrderDetail id={id} />
    </section>
  );
}
