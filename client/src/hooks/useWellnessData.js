import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useWellnessData(userId) {
  const [state, setState] = useState({ plan: null, checkIns: [], loading: true, error: '' })
  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('plans').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('check_ins').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    ]).then(([planResult, checkInResult]) => {
      if (!active) return
      const error = planResult.error || checkInResult.error
      setState({ plan: planResult.data ?? null, checkIns: checkInResult.data ?? [], loading: false, error: error ? friendlyError(error) : '' })
    })
    return () => { active = false }
  }, [userId])
  return state
}

function friendlyError(error) {
  if (/relation .*check_ins.* does not exist/i.test(error.message)) return 'Progress data is not ready. Apply the check-ins migration to Supabase.'
  if (/relation .*plans.* does not exist/i.test(error.message)) return 'Plan data is not ready. Apply the plans migration to Supabase.'
  return error.message || 'Your wellness data could not be loaded.'
}
