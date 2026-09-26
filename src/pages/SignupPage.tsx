import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react'
import { BrandMark } from '../components/ui/BrandMark'
import { signUp, setDemoSession } from '../services/authService'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName || !email || !password || !confirmPw) {
      setError('Please fill in all required fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPw) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      await signUp({ email, password, full_name: fullName })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to register account.')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoAccess() {
    setDemoSession()
    navigate('/dashboard')
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#070A0E] text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0E131A] border border-[#273241] rounded-2xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Account Registered!</h2>
            <p className="text-xs text-zinc-400">
              Your profile for <strong className="text-white">{email}</strong> has been registered.
            </p>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 space-y-2">
            <p className="font-semibold">Ready to enter your StockSense Console?</p>
            <p className="text-zinc-400 text-[11px]">Click below to enter immediately into the dashboard.</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleDemoAccess}
              className="w-full py-3 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <span>Enter Console Directly</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Return to Login Screen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070A0E] text-zinc-100 flex flex-col lg:flex-row">
      {/* Left panel — Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#05070A] border-r border-[#273241] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1769FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <BrandMark size={40} />
          <span className="text-2xl font-bold text-white tracking-tight">StockSense</span>
          <span className="text-[10px] font-mono font-bold bg-[#1769FF]/20 text-[#1769FF] px-2.5 py-0.5 rounded-full border border-[#1769FF]/30">
            REGISTER
          </span>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Join your Warehouse<br />
            <span className="text-[#1769FF]">Operations Team.</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Create an enterprise inventory manager profile with full multi-location stock velocity tracking.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Role Security', desc: 'Manager & Staff RBAC' },
              { label: 'Live Audit Log', desc: 'Immutable transactions' },
              { label: 'Real-Time Sync', desc: 'Multi-warehouse updates' },
              { label: 'Low Stock Alerts', desc: 'Instant safety thresholds' },
            ].map((item) => (
              <div key={item.label} className="p-3.5 bg-[#0E131A] border border-[#273241] rounded-xl space-y-1">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1769FF]" />
                  <span>{item.label}</span>
                </p>
                <p className="text-[11px] text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-600 flex items-center justify-between">
          <span>© 2026 StockSense Systems</span>
          <span className="font-mono">v1.0.0 · Production Ready</span>
        </div>
      </div>

      {/* Right panel — Form & Signup Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-[#0E131A] border border-[#273241] rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <BrandMark size={32} />
              <span className="text-xl font-bold text-white">StockSense</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-xs text-zinc-400">Join your team's inventory workspace</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#1769FF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#1769FF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#1769FF]"
                required
              />
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
              <span>{loading ? 'Registering...' : 'Create Account'}</span>
            </button>
          </form>

          <p className="text-xs text-center text-zinc-400 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#1769FF] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
