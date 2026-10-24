import type { ActionRecommendation } from '../../types/actionCenter'

export const categoryLabels: Record<ActionRecommendation['category'], string> = {
  retention: 'Retention',
  'repeat-purchase': 'Repeat Purchase',
  'win-back': 'Win-back',
  'low-cost-reengagement': 'Low-cost Re-engagement',
  'product-recommendation': 'Product Recommendation',
}

export function sourceLabel(source: ActionRecommendation['source']): string {
  return source === 'rfm' ? 'RFM profile' : source === 'cluster' ? 'Cluster profile' : 'Product pattern'
}
