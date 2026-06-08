import { Loader2, PackageOpen } from "lucide-react";

export function ButtonSpinner() {
  return <Loader2 className="animate-spin" size={16} />;
}

export function PageLoader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="grid min-h-[240px] place-items-center text-sm text-neutral-500">
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin" size={18} />
        {label}
      </div>
    </div>
  );
}

export function LoadingOverlay({ label = "Procesando..." }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-white/70 text-sm text-neutral-700">
      <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 shadow-sm">
        <Loader2 className="animate-spin" size={18} />
        {label}
      </div>
    </div>
  );
}

export function EmptyState({ label = "Sin datos" }: { label?: string }) {
  return (
    <div className="grid place-items-center py-10 text-sm text-neutral-500">
      <div className="flex flex-col items-center gap-2">
        <PackageOpen size={28} />
        {label}
      </div>
    </div>
  );
}
