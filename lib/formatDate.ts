export function formatDate(
  date: Date | string,
  showTime: boolean = true
): string {
  const d = new Date(date);

  // Format date
  const formattedDate = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!showTime) return formattedDate;

  // Format time
  const formattedTime = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${formattedDate} at ${formattedTime}`;
}

export function utcToLocal(
  utcDate: Date | string,
  endOfDay: boolean = false
): Date {
  const date = new Date(utcDate);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  if (endOfDay) {
    localDate.setHours(23, 59, 59, 999);
  }

  return localDate;
}

export function localToUtc(localDate: Date | string, endOfDay: boolean = false): Date {
  const date = new Date(localDate);
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
  if (endOfDay) {
    utcDate.setUTCHours(23, 59, 59, 999);
  }
  
  return utcDate;
}
