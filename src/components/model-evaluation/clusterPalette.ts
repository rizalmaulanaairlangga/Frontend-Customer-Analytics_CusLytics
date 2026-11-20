import { getClusterColor } from '../../constants/metricColors'

export function clusterColor(index: number): string {
  return getClusterColor(index)
}
