import { useWellness } from '../context/wellness'

export function useWellnessData() {
  const { plan, checkIns, loading, error } = useWellness()
  return { plan, checkIns, loading, error }
}
