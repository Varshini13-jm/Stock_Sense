import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { BrandMark } from '../components/ui/BrandMark'
import { signIn, setDemoSession } from '../services/authService'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isUnconfirmed, setIsUnconfirmed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsUnconfirmed(false)

    if (!email || !password) {
      setError('Please fill in both email and password.')
      return
    }

    try {
      setLoading(true)
      await signIn({ email, password })
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.message || 'Login failed.'
      if (msg.toLowerCase().includes('email not confirmed')) {
        setIsUnconfirmed(true)
        setError('Your email requires confirmation by Supabase Auth.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleDemoAccess() {
    setDemoSession()
    navigate('/dashboard')
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
            ENTERPRISE SaaS
          </span>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Real-Time Enterprise<br />
            <span className="text-[#1769FF]">Inventory Velocity.</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Manage incoming receipts, internal transfers, outgoings, and physical adjustments backed by Supabase PostgreSQL.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Receipt Inbound', desc: 'Atomic stock increase' },
              { label: 'Internal Transfer', desc: 'Bin to bin relocation' },
              { label: 'Delivery Outbound', desc: 'Dispatch & order fulfillment' },
              { label: 'Stock Adjustment', desc: 'Count reconciliation' },
            ].map((item) => (
              <div key={item.label} className="p-3.5 bg-[#0E131A] border border-[#273241] rounded-xl space-y-1">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1769FF]" />
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

      {/* Right panel — Form & Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-[#0E131A] border border-[#273241] rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <BrandMark size={32} />
              <span className="text-xl font-bold text-white">StockSense</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to StockSense</h1>
            <p className="text-xs text-zinc-400">Enter your warehouse credentials to access your console</p>
          </div>

          {/* Unconfirmed Email Special Notice & Bypass */}
          {isUnconfirmed && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 text-xs">
              <div className="flex items-start gap-2 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Email Confirmation Required by Supabase</p>
                  <p className="text-zinc-400 mt-1">Supabase Auth requires link confirmation or you can bypass confirmation for evaluation.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Enter Console (Demo Session Bypass)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Standard Error */}
          {error && !isUnconfirmed && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@stocksense.com"
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#1769FF]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#1769FF] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : <LogIn className="w-4 h-4" />}
              <span>{loading ? 'Authenticating...' : 'Sign in'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#273241]" />
            <span className="absolute bg-[#0E131A] px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Instant Access
            </span>
          </div>

          {/* Instant Demo Session Bypass Button */}
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Instant Demo Access (Bypass Confirmation)</span>
          </button>

          <p className="text-xs text-center text-zinc-400 pt-2">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-[#1769FF] hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
