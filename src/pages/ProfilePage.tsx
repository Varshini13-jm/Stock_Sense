import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { UserCircle, Mail, Shield, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import { updateProfile, updatePassword } from '../services/authService'

export function ProfilePage() {
  const { user, profile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [password, setPassword] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPw, setLoadingPw] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoadingProfile(true)
    setMessage('')
    setError('')
    try {
      await updateProfile(user.id, { full_name: fullName })
      setMessage('Profile updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoadingPw(true)
    setMessage('')
    setError('')
    try {
      await updatePassword(password)
      setMessage('Password updated successfully!')
      setPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoadingPw(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-[#1769FF]" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Account & Profile</h1>
        </div>
        <p className="text-sm text-zinc-400 mt-1">Manage authenticated session details and credentials</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-[#0E131A] border border-[#273241] rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-[#1769FF]" />
            <span>Profile Details</span>
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-[#1769FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#070A0E]/60 border border-[#273241] rounded-xl text-sm text-zinc-400">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span>{user?.email || 'Not logged in'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Role
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#070A0E]/60 border border-[#273241] rounded-xl text-sm text-zinc-400">
                <Shield className="w-4 h-4 text-[#1769FF]" />
                <span className="capitalize">{profile?.role || 'Inventory Manager'}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingProfile}
              className="w-full py-2.5 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {loadingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-[#0E131A] border border-[#273241] rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span>Update Security Password</span>
          </h2>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-[#1769FF]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingPw}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {loadingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
