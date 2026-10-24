import type { AnalyticsService, DashboardFilters, DashboardSnapshot, DateInterval, TrendPoint } from '../types/analytics'

interface DemoFixture extends DashboardSnapshot {
  demoTrends: Record<DateInterval, TrendPoint[]>
}

const demoSnapshot: DemoFixture = {
  source: 'demo',
  filters: { startDate: '', endDate: '', country: '' },
  interval: 'month',
  metrics: {
    salesValue: { value: 48210, definition: 'Sum of qualifying transaction values. This is not profit.' },
    uniqueInvoices: { value: 1248, definition: 'Number of unique invoices that meet the backend inclusion rules.' },
    unitsSold: { value: 18392, definition: 'Units from transactions that meet the backend inclusion rules.' },
    identifiedCustomers: { value: 684, definition: 'Customers with a valid identifier under the backend eligibility rules.' },
  },
  trend: [
    { period: '2025-01', label: 'Jan', salesValue: 12400, uniqueInvoices: 312, unitsSold: 4520 },
    { period: '2025-02', label: 'Feb', salesValue: 15120, uniqueInvoices: 358, unitsSold: 5160 },
    { period: '2025-03', label: 'Mar', salesValue: 13950, uniqueInvoices: 341, unitsSold: 4820 },
    { period: '2025-04', label: 'Apr', salesValue: 16740, uniqueInvoices: 407, unitsSold: 5930 },
    { period: '2025-05', label: 'May', salesValue: 0, uniqueInvoices: 0, unitsSold: 0 },
  ],
  demoTrends: {
    day: [
      { period: '2025-01-01', label: 'Jan 01', salesValue: 620, uniqueInvoices: 16, unitsSold: 224 },
      { period: '2025-01-08', label: 'Jan 08', salesValue: 840, uniqueInvoices: 21, unitsSold: 306 },
      { period: '2025-01-15', label: 'Jan 15', salesValue: 710, uniqueInvoices: 19, unitsSold: 272 },
      { period: '2025-01-22', label: 'Jan 22', salesValue: 930, uniqueInvoices: 24, unitsSold: 339 },
      { period: '2025-01-29', label: 'Jan 29', salesValue: 760, uniqueInvoices: 20, unitsSold: 288 },
    ],
    week: [
      { period: '2025-W01', label: 'Week 1', salesValue: 2800, uniqueInvoices: 72, unitsSold: 1018 },
      { period: '2025-W02', label: 'Week 2', salesValue: 3250, uniqueInvoices: 83, unitsSold: 1169 },
      { period: '2025-W03', label: 'Week 3', salesValue: 2980, uniqueInvoices: 78, unitsSold: 1098 },
      { period: '2025-W04', label: 'Week 4', salesValue: 3600, uniqueInvoices: 89, unitsSold: 1308 },
    ],
    month: [
      { period: '2025-01', label: 'Jan', salesValue: 12400, uniqueInvoices: 312, unitsSold: 4520 },
      { period: '2025-02', label: 'Feb', salesValue: 15120, uniqueInvoices: 358, unitsSold: 5160 },
      { period: '2025-03', label: 'Mar', salesValue: 13950, uniqueInvoices: 341, unitsSold: 4820 },
      { period: '2025-04', label: 'Apr', salesValue: 16740, uniqueInvoices: 407, unitsSold: 5930 },
      { period: '2025-05', label: 'May', salesValue: 0, uniqueInvoices: 0, unitsSold: 0 },
    ],
  },
  products: [
    { productId: 'DEMO-01', description: 'Ceramic coffee set', salesValue: 8420, unitsSold: 1190, uniqueInvoices: 74 },
    { productId: 'DEMO-02', description: 'Linen table runner', salesValue: 6910, unitsSold: 1540, uniqueInvoices: 82 },
    { productId: 'DEMO-03', description: 'Brass desk lamp', salesValue: 6240, unitsSold: 680, uniqueInvoices: 53 },
    { productId: 'DEMO-04', description: 'Botanical print set', salesValue: 4930, unitsSold: 2120, uniqueInvoices: 66 },
    { productId: 'DEMO-05', description: 'Stoneware serving bowl', salesValue: 4210, unitsSold: 860, uniqueInvoices: 51 },
    { productId: 'DEMO-06', description: 'Woven storage basket', salesValue: 3880, unitsSold: 970, uniqueInvoices: 46 },
    { productId: 'DEMO-07', description: 'Glass pendant light', salesValue: 3510, unitsSold: 510, uniqueInvoices: 39 },
    { productId: 'DEMO-08', description: 'Cotton cushion cover', salesValue: 3290, unitsSold: 1460, uniqueInvoices: 71 },
    { productId: 'DEMO-09', description: 'Walnut serving board', salesValue: 2870, unitsSold: 735, uniqueInvoices: 44 },
    { productId: 'DEMO-10', description: 'Ceramic planter pair', salesValue: 2540, unitsSold: 830, uniqueInvoices: 49 },
    { productId: 'DEMO-11', description: 'Indigo linen napkins', salesValue: 2180, unitsSold: 1180, uniqueInvoices: 63 },
    { productId: 'DEMO-12', description: 'Hand-finished brass hooks', salesValue: 1940, unitsSold: 620, uniqueInvoices: 37 },
  ],
  countries: [
    { country: 'France', transactionValue: 18420, uniqueInvoices: 387 },
    { country: 'Germany', transactionValue: 15980, uniqueInvoices: 412 },
    { country: 'United Kingdom', transactionValue: 13810, uniqueInvoices: 449 },
  ],
  countryOptions: ['France', 'Germany', 'United Kingdom'],
  customerSummary: {
    identifiedCustomers: 684,
    rfmStatus: 'pending',
    rfmMessage: 'RFM results are not included in this demo fixture.',
  },
  status: {},
}

export const demoAnalyticsService: AnalyticsService = {
  async getDashboard(filters: DashboardFilters, interval: DateInterval): Promise<DashboardSnapshot> {
    return {
      ...demoSnapshot,
      filters: { ...filters },
      interval,
      metrics: { ...demoSnapshot.metrics },
      trend: demoSnapshot.demoTrends[interval],
      products: demoSnapshot.products,
      customerSummary: { ...demoSnapshot.customerSummary },
      status: {},
    }
  },
}
