import { createContext, useContext } from 'react'

export const WellnessContext = createContext(null)

export function useWellness() {
  const context = useContext(WellnessContext)
  if (!context) throw new Error('useWellness must be used inside WellnessProvider')
  return context
}
