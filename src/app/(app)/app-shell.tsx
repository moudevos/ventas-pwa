"use client";

import { BarChart3, Boxes, ChevronLeft, ClipboardList, History, LayoutDashboard, Menu, MoreHorizontal, PackagePlus, Printer, ScrollText, Send, ShieldCheck, ShoppingBag, Truck, Users, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "./logout-button";

type NavGroup = {
  title: string;
  items: Array<{ label: string; href: string; icon: LucideIcon }>;
};

const nav: NavGroup[] = [
  { title: "Dashboard", items: [{ label: "Inicio", href: "/dashboard", icon: LayoutDashboard }] },
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
  { title: "Clientes", items: [{ label: "Clientes", href: "/clients", icon: Users }] },
  {
    title: "Administracion",
    items: [
      { label: "Usuarios", href: "/admin/users", icon: Send },
      { label: "Auditoria", href: "/audit", icon: ShieldCheck },
    ],
  },
];

const bottomNav = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Nuevo", href: "/orders/new", icon: PackagePlus },
  { label: "Pedidos", href: "/orders", icon: ClipboardList },
  { label: "Ventas", href: "/sales/dashboard", icon: BarChart3 },
];

export function AppShell({ children, email, role }: { children: React.ReactNode; email: string; role: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const title = getScreenTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <Sidebar collapsed={collapsed} email={email} expanded={expanded} onCollapse={() => setCollapsed((value) => !value)} onExpandedChange={setExpanded} pathname={pathname} />
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Cerrar menu" className="absolute inset-0 bg-slate-950/60" onClick={() => setDrawerOpen(false)} type="button" />
          <div className="relative h-full w-[82vw] max-w-[320px] min-w-[280px]">
            <Sidebar collapsed={false} email={email} expanded={expanded} mobile onClose={() => setDrawerOpen(false)} onExpandedChange={setExpanded} pathname={pathname} />
          </div>
        </div>
      ) : null}

      <main className={collapsed ? "md:pl-20" : "md:pl-64"}>
        <header className="sticky top-0 z-30 flex min-h-14 items-center border-b border-slate-200 bg-white/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200" onClick={() => setDrawerOpen(true)} type="button">
            <Menu size={18} />
          </button>
          <div className="ml-3 min-w-0 flex-1">
            <span className="block truncate font-semibold">{title}</span>
            <span className="block truncate text-[11px] text-slate-500">{role} · {email}</span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-4 sm:px-4 md:pb-6 md:pt-6">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {bottomNav.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-500"}`} href={href} key={href}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-slate-500" onClick={() => setDrawerOpen(true)} type="button">
            <MoreHorizontal size={18} />
            <span>Mas</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function Sidebar({
  collapsed,
  email,
  expanded,
  mobile = false,
  onClose,
  onCollapse,
  onExpandedChange,
  pathname,
}: {
  collapsed: boolean;
  email: string;
  expanded: Record<string, boolean>;
  mobile?: boolean;
  onClose?: () => void;
  onCollapse?: () => void;
  onExpandedChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  pathname: string;
}) {
  return (
    <aside className={`flex h-full flex-col border-r border-slate-800 bg-slate-950 p-4 text-white shadow-2xl transition-all ${mobile ? "w-full" : collapsed ? "w-20" : "w-64"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{collapsed ? "VP" : "Ventas PWA"}</div>
          {!collapsed ? <p className="mt-1 truncate text-xs text-slate-400">{email}</p> : null}
        </div>
        {mobile ? (
          <button className="grid h-10 w-10 place-items-center rounded-lg text-slate-300 hover:bg-slate-800" onClick={onClose} type="button">
            <X size={18} />
          </button>
        ) : (
          <button className="grid h-10 w-10 place-items-center rounded-lg text-slate-300 hover:bg-slate-800" onClick={onCollapse} type="button">
            <ChevronLeft className={collapsed ? "rotate-180" : ""} size={18} />
          </button>
        )}
      </div>

      <nav className="native-scroll mt-7 grid gap-2 overflow-y-auto pr-1">
        {nav.map((group) => {
          const groupActive = group.items.some((item) => isActive(pathname, item.href));
          const isExpanded = collapsed ? true : expanded[group.title] ?? groupActive;
          return (
            <div key={group.title}>
              {!collapsed ? (
                <button className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-900" onClick={() => onExpandedChange((current) => ({ ...current, [group.title]: !isExpanded }))} type="button">
                  <span className="truncate">{group.title}</span>
                  <span>{isExpanded ? "-" : "+"}</span>
                </button>
              ) : null}
              {isExpanded ? (
                <div className="mt-1 grid gap-1">
                  {group.items.map(({ label, href, icon: Icon }) => {
                    const active = isActive(pathname, href);
                    return (
                      <Link className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm ${collapsed ? "justify-center" : ""} ${active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`} href={href} key={`${group.title}-${href}`} onClick={onClose} title={label}>
                        <Icon size={17} />
                        {!collapsed ? <span className="truncate">{label}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mt-auto border-t border-slate-800 pt-4">
          <LogoutButton />
        </div>
      ) : null}
    </aside>
  );
}

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/orders") return pathname.startsWith("/orders/") && pathname !== "/orders/new";
  if (href === "/dashboard") return false;
  return pathname.startsWith(`${href}/`);
}

function getScreenTitle(pathname: string) {
  const match = [...nav.flatMap((group) => group.items)]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(pathname, item.href));
  return match?.label ?? "Ventas PWA";
}
