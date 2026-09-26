import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/inventory'
import type { User, Session } from '@supabase/supabase-js'
import { getProfile, DEMO_USER } from '../services/authService'

interface AuthState {
  user: User | any | null
  session: Session | any | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  const loadProfile = useCallback(async (userId: string) => {
    const profile = await getProfile(userId)
    setState((s) => ({ ...s, profile }))
  }, [])

  const checkAuth = useCallback(async () => {
    // Check demo fallback first
    const demo = localStorage.getItem('stocksense-demo-user')
    if (demo) {
      const demoUser = JSON.parse(demo)
      setState({
        user: demoUser,
        session: { user: demoUser } as any,
        profile: {
          id: DEMO_USER.id,
          full_name: 'Demo Inventory Manager',
          role: 'Inventory Manager',
          created_at: DEMO_USER.created_at,
        },
        loading: false,
      })
      return
    }

    // Check Supabase session
    const { data } = await supabase.auth.getSession()

    if (data.session?.user) {
      setState({
        user: data.session.user,
        session: data.session,
        profile: null,
        loading: false,
      })
      loadProfile(data.session.user.id)
    } else {
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
      })
    }
  }, [loadProfile])

  useEffect(() => {
    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const demo = localStorage.getItem('stocksense-demo-user')
      if (demo) return

      if (session?.user) {
        setState({
          user: session.user,
          session,
          profile: null,
          loading: false,
        })
        loadProfile(session.user.id)
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
        })
      }
    })

    const handleCustomAuth = () => checkAuth()
    window.addEventListener('stocksense-auth-change', handleCustomAuth)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('stocksense-auth-change', handleCustomAuth)
    }
  }, [checkAuth, loadProfile])

  return state
}