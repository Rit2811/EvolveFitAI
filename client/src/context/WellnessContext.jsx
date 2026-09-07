import { useCallback, useEffect, useMemo, useState } from 'react'
import { accountApi } from '../lib/accountApi'
import { sortCheckIns } from '../lib/wellnessData'
import { useAuth } from './auth'
import { WellnessContext } from './wellness'

export function WellnessProvider({ children }) {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [plan, setPlan] = useState(null)
  const [checkIns, setCheckIns] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshWellnessData = useCallback(async () => {
    if (!user) { setPlan(null); setCheckIns([]); setError(''); setDataLoading(false); return }
    setDataLoading(true); setError('')
    try {
      const data = await accountApi.getWellness()
      setPlan(data.plan); setCheckIns(sortCheckIns(data.checkIns || []))
    } catch (loadError) { setError(loadError.message) }
    finally { setDataLoading(false) }
  }, [user])

  useEffect(() => { refreshWellnessData() }, [refreshWellnessData])

  const saveProfile = useCallback(async (profileData) => {
    await accountApi.saveProfile(profileData)
    return refreshProfile()
  }, [refreshProfile])

  const savePlan = useCallback(async (planData) => {
    const data = await accountApi.savePlan(planData)
    setPlan(data.plan)
    return data.plan
  }, [])

  const clearPlan = useCallback(async () => {
    await accountApi.clearPlan()
    setPlan(null)
  }, [])

  const addCheckIn = useCallback(async (checkIn) => {
    const data = await accountApi.saveCheckIn(checkIn)
    setCheckIns((current) => sortCheckIns([...current, data.checkIn]))
    return data.checkIn
  }, [])

  const value = useMemo(() => ({ profile, plan, checkIns, loading: authLoading || dataLoading, error, refreshWellnessData, saveProfile, savePlan, clearPlan, addCheckIn }), [addCheckIn, authLoading, checkIns, clearPlan, dataLoading, error, plan, profile, refreshWellnessData, savePlan, saveProfile])
  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>
}
