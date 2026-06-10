"use client";

import { X } from "lucide-react";

import { ButtonSpinner, EmptyState, PageLoader } from "@/components/loading";

export { ButtonSpinner, EmptyState, PageLoader };

export function AppCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

export function AppButton({
  children,
  className = "",
  pending,
  tone = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean; tone?: "primary" | "secondary" | "danger" }) {
  const tones = {
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  };
  return (
    <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-60 ${tones[tone]} ${className}`} disabled={pending || props.disabled} {...props}>
      {pending ? <ButtonSpinner /> : null}
      {children}
    </button>
  );
}

export function AppBadge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "amber" | "emerald" | "rose" | "slate" }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function AppModal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
      <button aria-label="Cerrar modal" className="absolute inset-0" onClick={onClose} type="button" />
      <section className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-w-2xl sm:rounded-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-950">{title}</h2>
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
      </section>
    </div>
  );
}

export const BottomSheet = AppModal;

export function ResponsiveTable({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`overflow-x-auto ${className}`}>{children}</div>;
}

export function ResponsiveCardList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-3 ${className}`}>{children}</div>;
}
