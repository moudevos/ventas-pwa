"use client";

import { ImageIcon } from "lucide-react";

export function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 ${className}`}>
      <ImageIcon size={22} />
    </div>
  );
}

export function AppImage({ alt, className = "", src }: { alt: string; className?: string; src?: string | null }) {
  if (!src) return <ImagePlaceholder className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className={`bg-slate-50 ${className}`} loading="lazy" src={src} />
  );
}
