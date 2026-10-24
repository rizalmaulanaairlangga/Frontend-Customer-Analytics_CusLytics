const clusterColors = ['var(--cluster-1)', 'var(--cluster-2)', 'var(--cluster-3)', 'var(--cluster-4)', 'var(--cluster-5)', 'var(--cluster-6)', 'var(--cluster-7)', 'var(--cluster-8)']

export function clusterColor(index: number): string {
  return clusterColors[index % clusterColors.length]
}
