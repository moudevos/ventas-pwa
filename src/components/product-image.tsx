"use client";

import { ImageOff, ImagePlus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { showError } from "@/lib/alerts";
import { api } from "@/lib/api-client";
import { compressImage } from "@/lib/image-compress";
import { AppImage, ImagePlaceholder } from "./ui/app-image";
import { AppButton } from "./ui/app-ui";

type UploadedFile = { id: string; publicUrl: string };

export function ProductImage({ alt, className = "", src }: { alt: string; className?: string; src?: string | null }) {
  return <AppImage alt={alt} className={className} src={src} />;
}

export function ProductImageUploader({
  currentUrl,
  disabled,
  onChange,
}: {
  currentUrl?: string | null;
  disabled?: boolean;
  onChange: (state: { file: File | null; previewUrl: string | null; remove: boolean }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const [remove, setRemove] = useState(false);

  const helper = useMemo(() => file ? `${file.name} listo para guardar` : "JPG, PNG o WebP hasta 3 MB luego de compresion", [file]);

  function update(next: { file: File | null; previewUrl: string | null; remove: boolean }) {
    setFile(next.file);
    setPreviewUrl(next.previewUrl);
    setRemove(next.remove);
    onChange(next);
  }

  async function pick(nextFile: File) {
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(nextFile.type)) throw new Error("Formato no permitido");
      const optimized = await compressImage(nextFile);
      if (optimized.size > 3 * 1024 * 1024) throw new Error("La imagen supera 3 MB");
      const url = URL.createObjectURL(optimized);
      update({ file: optimized, previewUrl: url, remove: false });
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo leer imagen");
    }
  }

  return (
    <div className="grid gap-3">
      <label
        className={`relative flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-center text-sm transition ${dragging ? "border-indigo-300 bg-indigo-50" : "border-slate-300 bg-slate-50"} ${disabled ? "pointer-events-none opacity-60" : ""}`}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const nextFile = event.dataTransfer.files?.[0];
          if (nextFile) void pick(nextFile);
        }}
      >
        {previewUrl && !remove ? (
          <ProductImage alt="Imagen de producto" className="h-40 w-full rounded-lg object-contain" src={previewUrl} />
        ) : (
          <ImagePlaceholder className="h-32 w-full" />
        )}
        <span className="inline-flex items-center gap-2 font-medium text-slate-700"><ImagePlus size={17} /> Seleccionar o arrastrar imagen</span>
        <span className="text-xs text-slate-500">{helper}</span>
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={disabled} onChange={(event) => { const nextFile = event.target.files?.[0]; if (nextFile) void pick(nextFile); }} type="file" />
      </label>
      <div className="flex flex-wrap gap-2">
        <AppButton disabled={disabled || (!previewUrl && !file)} onClick={() => update({ file: null, previewUrl: null, remove: true })} tone="danger" type="button">
          <Trash2 size={16} /> Quitar imagen
        </AppButton>
        {remove ? <span className="inline-flex items-center gap-1 text-sm text-rose-600"><ImageOff size={15} /> Se quitara al guardar</span> : null}
      </div>
    </div>
  );
}

export async function uploadProductImage(file: File, productId: string) {
  const presign = await api.post<{ signedUrl: string; publicUrl: string; fileKey: string }>("/api/uploads/presign", {
    filename: file.name,
    contentType: file.type,
    size: file.size,
    scope: "PRODUCT_IMAGE",
    entityId: productId,
  });
  const response = await fetch(presign.signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!response.ok) throw new Error("No se pudo subir la imagen");
  return api.post<UploadedFile>("/api/uploads/complete", {
    scope: "PRODUCT_IMAGE",
    entityId: productId,
    fileKey: presign.fileKey,
    publicUrl: presign.publicUrl,
    contentType: file.type,
    size: file.size,
    originalName: file.name,
  });
}
