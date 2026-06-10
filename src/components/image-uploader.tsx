"use client";

import { ImagePlus } from "lucide-react";
import { useState } from "react";

import { showError, showToast } from "@/lib/alerts";
import { api } from "@/lib/api-client";
import { compressImage } from "@/lib/image-compress";
import { ButtonSpinner } from "./loading";
import { AppImage } from "./ui/app-image";

type UploadedFile = { id: string; publicUrl: string };

export function ImageUploader({
  entityId,
  onUploaded,
  scope,
}: {
  entityId?: string;
  onUploaded?: (file: UploadedFile) => void;
  scope: "PRODUCT_IMAGE" | "ORDER_IMAGE" | "INVENTORY_IMAGE" | "EVIDENCE_IMAGE";
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);

  async function upload(file: File) {
    setPending(true);
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Formato no permitido");
      const optimized = await compressImage(file);
      if (optimized.size > 3 * 1024 * 1024) throw new Error("La imagen supera 3 MB");
      setPreview(URL.createObjectURL(optimized));
      const presign = await api.post<{ signedUrl: string; publicUrl: string; fileKey: string }>("/api/uploads/presign", {
        filename: optimized.name,
        contentType: optimized.type,
        size: optimized.size,
        scope,
        entityId,
      });
      const response = await fetch(presign.signedUrl, {
        method: "PUT",
        body: optimized,
        headers: { "Content-Type": optimized.type },
      });
      if (!response.ok) throw new Error("No se pudo subir la imagen");
      const saved = await api.post<UploadedFile>("/api/uploads/complete", {
        scope,
        entityId,
        fileKey: presign.fileKey,
        publicUrl: presign.publicUrl,
        contentType: optimized.type,
        size: optimized.size,
        originalName: file.name,
      });
      await showToast("Imagen subida");
      onUploaded?.(saved);
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo subir imagen");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-3">
      <label
        className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md p-3 text-center text-sm text-slate-600 ${dragging ? "bg-indigo-50 ring-2 ring-indigo-200" : "bg-slate-50"}`}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
      >
        {preview ? <AppImage alt="Preview" className="h-28 w-full rounded-md object-contain" src={preview} /> : <ImagePlus size={28} />}
        <span>{pending ? "Subiendo..." : "Seleccionar o arrastrar imagen"}</span>
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} type="file" />
      </label>
      {pending ? <div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><ButtonSpinner /> Procesando imagen</div> : null}
    </div>
  );
}
