/**
 * Format an amount in MAJOR units (2499, 24.99) for its currency.
 * ₹ amounts drop the paise (₹2,499); $ amounts keep cents ($24.99).
 * Never hardcode a currency glyph next to a number — use this.
 */
export function formatMoney(amount, currency = 'INR') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  const code = currency || 'INR';
  const fractionDigits = code === 'INR' ? 0 : 2;
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(Number(amount));
  } catch {
    return `${code} ${amount}`;
  }
}

export default formatMoney;
