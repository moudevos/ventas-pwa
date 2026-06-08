import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { getSession } from "@/server/auth/session";

import { InventoryPrintPanel } from "./print-panel";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");
  const rows = await db.select().from(products);
  return (
    <section> 
      <h1 className="text-2xl font-semibold print:hidden">Inventario imprimible</h1>
      <InventoryPrintPanel products={rows} />
    </section>
  );
}
 