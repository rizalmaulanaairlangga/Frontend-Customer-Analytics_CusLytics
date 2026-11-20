const metricSeries: Record<string, number> = {
  transactionValue: 1, salesValue: 1, sales: 1, monetary: 1,
  uniqueInvoices: 2, invoices: 2, frequency: 2,
  unitsSold: 3, units: 3,
  recency: 6,
  identifiedCustomers: 5, customers: 5,
}

export function getMetricColor(metricKey: string): string {
  return `var(--series-${metricSeries[metricKey] ?? 1})`
}

export function getClusterColor(index: number): string {
  return `var(--series-${(index % 6) + 1})`
}

export function getItemColor(id: string, allIds?: string[]): string {
  let index: number
  if (allIds) {
    const orderedIds = [...new Set(allIds)].sort()
    index = orderedIds.indexOf(id)
    if (index < 0) index = hashId(id)
  } else {
    index = hashId(id)
  }
  return `var(--series-${(index % 10) + 1})`
}

function hashId(id: string): number {
  let hash = 5381
  for (let index = 0; index < id.length; index += 1) hash = (hash * 33) ^ id.charCodeAt(index)
  return (hash >>> 0) % 10
}
