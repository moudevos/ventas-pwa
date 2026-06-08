"use client";

import Swal from "sweetalert2";

export const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2400,
  timerProgressBar: true,
});

export function showError(message: string) {
  return Swal.fire({
    title: "No se pudo completar",
    text: message,
    icon: "error",
    confirmButtonText: "Entendido",
    confirmButtonColor: "#171717",
  });
}

export function showToast(message: string, icon: "success" | "error" | "info" = "success") {
  return toast.fire({ title: message, icon });
}

export function showSuccess(message: string) {
  return Swal.fire({
    title: "Listo",
    text: message,
    icon: "success",
    confirmButtonText: "Continuar",
    confirmButtonColor: "#171717",
  });
}
