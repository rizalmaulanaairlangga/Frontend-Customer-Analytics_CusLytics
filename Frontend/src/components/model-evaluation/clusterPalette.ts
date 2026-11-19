const clusterColors = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--series-6)']

export function clusterColor(index: number): string {
  return clusterColors[index % clusterColors.length]
}
