export function normalizeDocument(input: { documentType: "DNI" | "CEX"; documentId: string }) {
  const digits = input.documentId.replace(/\D/g, "");
  if (input.documentType === "DNI") {
    if (digits.length !== 8) throw new Error("DNI must have 8 digits");
    return digits;
  }
  if (digits.length > 12) throw new Error("CEX must have at most 12 digits");
  return digits.padStart(12, "0");
}
