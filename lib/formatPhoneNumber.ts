export function formatPhoneNumber(phone: string) {
  return phone.startsWith("+964") ? "0" + phone.slice(4) : phone;
}
