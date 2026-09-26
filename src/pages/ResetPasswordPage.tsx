import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, AlertCircle, CheckCircle } from 'lucide-react'
import { BrandMark } from '../components/ui/BrandMark'
import { updatePassword } from '../services/authService'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!password || !confirmPw) {
      setError('Please fill in both password fields.')
      return
    }
    if (password !== confirmPw) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070A0E] text-zinc-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#0E131A] border border-[#273241] rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandMark size={44} />
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2">Reset Password</h1>
          <p className="text-sm text-zinc-400">Enter your new secure password below</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-emerald-300">Password reset successful!</p>
            <p className="text-xs text-zinc-400">Redirecting to login page in 3 seconds...</p>
            <Link to="/login" className="inline-block text-xs text-[#1769FF] font-semibold underline mt-2">
              Click here to login immediately
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#1769FF]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#1769FF]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
