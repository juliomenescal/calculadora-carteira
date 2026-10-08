export const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const percentFormatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export function formatCurrency(value: number) { return currencyFormatter.format(Number.isFinite(value) ? value : 0); }
export function formatPercent(value: number) { return `${percentFormatter.format((Number.isFinite(value) ? value : 0) * 100)}%`; }
export function parseDecimal(value: string) {
  const compact = value.trim().replace(/\s/g, "");
  const normalized = compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact;
  return normalized ? Number(normalized) : Number.NaN;
}
