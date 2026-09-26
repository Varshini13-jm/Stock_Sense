import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, CheckCircle2, AlertCircle, Loader2, Database, Shield, ArrowRight } from 'lucide-react'
import { BrandMark } from '../components/ui/BrandMark'
import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY = 'stocksense_supabase_config'

// Required tables for StockSense to function
const REQUIRED_TABLES = [
  'profiles',
  'categories',
  'warehouses',
  'locations',
  'products',
  'inventory_balances',
  'inventory_documents',
  'inventory_document_lines',
  'stock_movements',
]

type TestResult = {
  step: string
  ok: boolean
  message: string
}

export function SupabaseConnectPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [connected, setConnected] = useState(false)
  const [consented, setConsented] = useState(false)
  const [error, setError] = useState('')

  async function handleTest() {
    setTesting(true)
    setResults([])
    setError('')
    setConnected(false)

    const log = (step: string, ok: boolean, message: string) => {
      setResults((prev) => [...prev, { step, ok, message }])
    }

    // Step 1 — URL format
    let cleanUrl = url.trim().replace(/\/+$/, '')
    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      log('URL Format', false, 'Invalid Supabase URL. Must be https://xxxx.supabase.co')
      setTesting(false)
      return
    }
    log('URL Format', true, 'Valid Supabase project URL')

    // Step 2 — Anon key format
    const keyTrimmed = anonKey.trim()
    if (keyTrimmed.length < 40) {
      log('API Key', false, 'Invalid anon/publishable key — too short')
      setTesting(false)
      return
    }
    log('API Key', true, 'Anon key format looks valid')

    // Step 3 — Create temporary client and test connectivity
    let client: ReturnType<typeof createClient>
    try {
      client = createClient(cleanUrl, keyTrimmed)
    } catch {
      log('Connection', false, 'Failed to initialise Supabase client')
      setTesting(false)
      return
    }

    // Step 4 — Ping project (attempt a simple health check via auth)
    try {
      const { error: authErr } = await client.auth.getSession()
      if (authErr && authErr.message !== 'Auth session missing') {
        log('Connectivity', false, `Cannot reach Supabase project: ${authErr.message}`)
        setTesting(false)
        return
      }
      log('Connectivity', true, 'Supabase project is reachable')
    } catch {
      log('Connectivity', false, 'Network error — could not reach Supabase project')
      setTesting(false)
      return
    }

    // Step 5 — Check required StockSense tables
    const missing: string[] = []
    for (const table of REQUIRED_TABLES) {
      try {
        const { error: tErr } = await client.from(table).select('id').limit(1)
        if (tErr && tErr.code !== 'PGRST116') {
          // PGRST116 = no rows (empty table) — that's fine
          missing.push(table)
        }
      } catch {
        missing.push(table)
      }
    }

    if (missing.length > 0) {
      log(
        'Schema Check',
        false,
        `Missing StockSense tables: ${missing.join(', ')}. Run the database migration SQL first.`
      )
      setTesting(false)
      return
    }

    log('Schema Check', true, `All ${REQUIRED_TABLES.length} required StockSense tables found`)

    // All checks passed
    setConnected(true)
    setTesting(false)
  }

  function handleConnect() {
    if (!consented) return
    // Persist the chosen project config so the Supabase client can pick it up
    const cleanUrl = url.trim().replace(/\/+$/, '')
    const config = { url: cleanUrl, anonKey: anonKey.trim() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    navigate('/login')
  }

  const allOk = results.length > 0 && results.every((r) => r.ok)

  return (
    <div className="min-h-screen bg-[#070A0E] text-zinc-100 flex flex-col lg:flex-row">
      {/* Left panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#05070A] border-r border-[#273241] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1769FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <BrandMark size={40} />
          <span className="text-2xl font-bold text-white tracking-tight">StockSense</span>
          <span className="text-[10px] font-mono font-bold bg-[#1769FF]/20 text-[#1769FF] px-2.5 py-0.5 rounded-full border border-[#1769FF]/30">
            SETUP
          </span>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Connect your<br />
            <span className="text-[#1769FF]">Supabase Project.</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            StockSense uses your own Supabase project as the database backend.
            Only your Supabase Project URL and anon/publishable key are required.
            Your secret service key is never needed or requested.
          </p>

          <div className="space-y-3">
            {[
              { icon: Shield, label: 'Security First', desc: 'Only the anon key is used — never your service_role key' },
              { icon: Database, label: 'Your Data', desc: 'All inventory data lives in your own Supabase project' },
              { icon: CheckCircle2, label: 'One-Time Setup', desc: 'Configure once; StockSense remembers your project' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-3.5 bg-[#0E131A] border border-[#273241] rounded-xl">
                <item.icon className="w-4 h-4 text-[#1769FF] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-600">© 2026 StockSense Systems</div>
      </div>

      {/* Right panel — Connection form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <BrandMark size={32} />
            <span className="text-xl font-bold text-white">StockSense</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Connect Supabase Project</h1>
            <p className="text-xs text-zinc-400">Enter your project credentials to get started</p>
          </div>

          {/* Form */}
          <div className="bg-[#0E131A] border border-[#273241] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Supabase Project URL *
              </label>
              <input
                id="supabase-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxx.supabase.co"
                disabled={connected}
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#1769FF] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Supabase Anon / Publishable Key *
              </label>
              <input
                id="supabase-anon-key"
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="sb_publishable_••••••••••••"
                disabled={connected}
                className="w-full px-4 py-2.5 bg-[#070A0E] border border-[#273241] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#1769FF] font-mono disabled:opacity-50"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Only the anon/publishable key is required. Never enter your service_role key.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Test Connection Button */}
            {!connected && (
              <button
                id="test-connection-btn"
                onClick={handleTest}
                disabled={testing || !url || !anonKey}
                className="w-full py-2.5 bg-[#273241] hover:bg-[#334155] border border-[#334155] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Testing Connection...</span></>
                ) : (
                  <><Link2 className="w-4 h-4" /><span>Test Connection</span></>
                )}
              </button>
            )}

            {/* Test results */}
            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${
                    r.ok
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {r.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    }
                    <div>
                      <span className="font-bold">{r.step}: </span>
                      <span className="opacity-80">{r.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Consent + Connect — shown only after successful test */}
            {allOk && (
              <div className="space-y-4 border-t border-[#273241] pt-4">
                <div className="p-4 bg-[#1769FF]/10 border border-[#1769FF]/30 rounded-xl text-xs text-zinc-300 space-y-2">
                  <p className="font-bold text-white">✅ Connection Verified</p>
                  <p>StockSense will connect to your Supabase project and manage inventory-related data including products, stock levels, operations, and movements.</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    id="consent-checkbox"
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border border-[#273241] bg-[#070A0E] accent-[#1769FF] cursor-pointer"
                  />
                  <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">
                    I authorize StockSense to connect to and manage inventory data in this Supabase project.
                  </span>
                </label>

                <button
                  id="connect-continue-btn"
                  onClick={handleConnect}
                  disabled={!consented}
                  className="w-full py-3 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Connect & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-center text-zinc-500">
            Already configured?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#1769FF] font-bold hover:underline"
            >
              Go to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
