import { supabase } from '../lib/supabase'

export interface SignUpInput {
  email: string
  password: string
  full_name: string
}

export interface SignInInput {
  email: string
  password: string
}

export const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@stocksense.com',
  user_metadata: { full_name: 'Demo Inventory Manager' },
  role: 'authenticated',
  created_at: new Date().toISOString(),
}

export async function signUp({ email, password, full_name }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export function setDemoSession() {
  localStorage.setItem('stocksense-demo-user', JSON.stringify(DEMO_USER))
  window.dispatchEvent(new Event('stocksense-auth-change'))
}

export async function signOut() {
  localStorage.removeItem('stocksense-demo-user')
  window.dispatchEvent(new Event('stocksense-auth-change'))
  try {
    await supabase.auth.signOut()
  } catch (err) {
    // Ignore if no active supabase session
  }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function getSession() {
  const demo = localStorage.getItem('stocksense-demo-user')
  if (demo) {
    return { user: JSON.parse(demo) }
  }
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getProfile(userId: string) {
  if (userId === DEMO_USER.id) {
    return {
      id: DEMO_USER.id,
      full_name: 'Demo Inventory Manager',
      role: 'Inventory Manager',
      created_at: DEMO_USER.created_at,
    }
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function updateProfile(userId: string, updates: { full_name?: string; role?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .single()
  if (error) throw error
  return data
}
