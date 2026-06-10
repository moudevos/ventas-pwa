const MAX_SIDE = 1600;
const QUALITY = 0.8;

export async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const type = canvas.toDataURL("image/webp").startsWith("data:image/webp") ? "image/webp" : file.type;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, type === "image/webp" ? ".webp" : ""), { type });
}
