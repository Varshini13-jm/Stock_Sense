import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { BrandMark } from '../components/ui/BrandMark'
import { resetPassword } from '../services/authService'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email address.'); return }
    try {
      setLoading(true)
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <BrandMark size={28} />
          <span className="text-lg font-bold text-gray-900">StockSense</span>
        </div>

        {sent ? (
          <div className="card p-8 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reset link sent</h2>
            <p className="text-sm text-gray-500 mb-6">
              Check <strong>{email}</strong> for a password reset link. The link expires in 1 hour.
            </p>
            <Link to="/login" className="btn-secondary w-full justify-center">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Reset password</h1>
            <p className="text-sm text-gray-500 mb-8">
              Enter your email and we'll send a password reset link.
            </p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="reset-email"
                    type="email"
                    className="input-field pl-9"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button id="reset-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <LoadingSpinner size="sm" /> : <Mail className="w-4 h-4" />}
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="text-sm text-center text-gray-500 mt-6">
              <Link to="/login" className="font-semibold text-brand hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
