"use client";

import { BarChart3, Boxes, ClipboardList, History, LayoutDashboard, Menu, PackagePlus, Printer, ScrollText, Send, ShieldCheck, ShoppingBag, Truck, Users, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "./logout-button";

type NavGroup = {
  title: string;
  items: Array<{ label: string; href: string; icon: LucideIcon }>;
};

const nav: NavGroup[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Pedidos",
    items: [
      { label: "Crear pedido", href: "/orders/new", icon: PackagePlus },
      { label: "Pedidos", href: "/orders", icon: ClipboardList },
      { label: "Envios", href: "/shipping", icon: Truck },
    ],
  },
  {
    title: "Ventas",
    items: [
      { label: "Ventas", href: "/sales/dashboard", icon: BarChart3 },
      { label: "Venta en tienda", href: "/sales", icon: ShoppingBag },
      { label: "Historial de ventas", href: "/sales/history", icon: History },
      { label: "Reportes", href: "/reports", icon: ScrollText },
    ],
  },
  {
    title: "Inventario",
    items: [
      { label: "Productos", href: "/products", icon: Boxes },
      { label: "Inventario", href: "/inventory", icon: Printer },
      { label: "Kardex", href: "/kardex", icon: BarChart3 },
    ],
  },
  {
    title: "Clientes",
    items: [
      { label: "Clientes", href: "/clients", icon: Users },
    ],
  },
  {
    title: "Administracion",
    items: [
      { label: "Usuarios", href: "/admin/users", icon: Send },
      { label: "Auditoria", href: "/audit", icon: ShieldCheck },
    ],
  },
];

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-slate-950 p-4 text-white md:w-64">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Ventas PWA</div>
          <p className="mt-1 text-xs text-slate-400">{email}</p>
        </div>
        <button className="rounded-md p-2 text-slate-300 hover:bg-slate-800 md:hidden" onClick={() => setOpen(false)} type="button">
          <X size={18} />
        </button>
      </div>
      <nav className="mt-8 grid gap-3 overflow-y-auto">
        {nav.map((group) => {
          const isExpanded = expanded[group.title] ?? false;
          return (
            <div key={group.title}>
              <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-900" onClick={() => setExpanded((current) => ({ ...current, [group.title]: !isExpanded }))} type="button">
                {group.title}
                <span>{isExpanded ? "-" : "+"}</span>
              </button>
              {isExpanded ? (
                <div className="mt-1 grid gap-1">
                  {group.items.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                    return (
                      <Link className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`} href={href} key={`${group.title}-${href}`} onClick={() => setOpen(false)}>
                        <Icon size={17} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="mt-auto pt-4">
        <LogoutButton />
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-950/60" aria-label="Cerrar menu" onClick={() => setOpen(false)} type="button" />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}
      <main className="md:pl-64">
        <div className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:hidden">
          <button className="rounded-md border p-2" onClick={() => setOpen(true)} type="button">
            <Menu size={18} />
          </button>
          <span className="ml-3 font-semibold">Ventas PWA</span>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
