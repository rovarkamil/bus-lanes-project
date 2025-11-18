export function getIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  return forwardedFor
    ? forwardedFor.split(",")[0]
    : headers.get("x-real-ip") || "unknown";
}
