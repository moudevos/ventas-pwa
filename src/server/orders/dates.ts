export function parseOperationalDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000-05:00`);
  }
  return new Date(value);
}
