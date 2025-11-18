export function uuidToNumber(uuid: string): string {
  // Remove all non-numeric characters and take first 12 digits
  return uuid.replace(/[^0-9]/g, "").slice(0, 12);
}
