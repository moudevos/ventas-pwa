import { Suspense } from "react";

import { PageLoader } from "@/components/loading";

import { OrdersList } from "./orders-list";

export default function OrdersPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Pedidos</h1>
      <Suspense fallback={<PageLoader label="Cargando pedidos..." />}>
        <OrdersList />
      </Suspense>
    </section>
  );
}
