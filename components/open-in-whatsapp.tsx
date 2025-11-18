export const openInWhatsapp = (phone: string) => {
  phone = phone.replace(/\s/g, "").replace(/\+/g, "");

  const url = `https://wa.me/${phone}`;
  window.open(url, "_blank");
};
