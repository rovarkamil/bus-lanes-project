export const formatNumber = (num: number): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(num);
};
