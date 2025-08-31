export function formatCurrency(value: number): string {
  if (!isFinite(value as number)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent3(decimalValue: number): string {
  if (!isFinite(decimalValue as number)) return "0.000%";
  return `${(decimalValue * 100).toFixed(3)}%`;
}

export function formatIntegerWithCommas(value: number): string {
  if (!isFinite(value as number)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function parseCurrencyToNumber(input: string): number {
  const cleaned = (input || "").toString().replace(/[^0-9.\-]/g, "");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

export function parsePercentToDecimal(input: string): number {
  const raw = (input || "").toString().trim();
  if (raw.length === 0) return 0;
  const hasPct = /%/.test(raw);
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  const n = parseFloat(cleaned);
  if (!isFinite(n)) return 0;
  return hasPct || n > 1 ? n / 100 : n;
}

export function parseInteger(input: string): number {
  const cleaned = (input || "").toString().replace(/[^0-9\-]/g, "");
  const n = parseInt(cleaned, 10);
  return isFinite(n as number) ? n : 0;
}


