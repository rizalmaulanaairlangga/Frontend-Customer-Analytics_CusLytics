export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat('id-ID', options).format(value)
}

export function formatCurrency(value: number, currencyCode: string, maximumFractionDigits = 2): string {
  try {
    return formatNumber(value, { style: 'currency', currency: currencyCode, maximumFractionDigits })
  } catch {
    return formatNumber(value, { maximumFractionDigits })
  }
}
