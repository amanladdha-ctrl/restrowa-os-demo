export function getRestaurantOrderPrefix(source: string) {
  const cleaned = source.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return (cleaned.slice(0, 2) || "RW").padEnd(2, "X");
}

export function buildOrderCode(source: string, orderNumber: number) {
  return `${getRestaurantOrderPrefix(source)}-${orderNumber}`;
}
