import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, Monitor, Settings, ShieldCheck, Database, Sliders } from 'lucide-react'

export function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#1769FF]" />
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        </div>
        <p className="text-sm text-zinc-400 mt-1">Manage application preferences, appearance, and environment state</p>
      </div>

      {/* Appearance Section */}
      <div className="bg-[#0E131A] border border-[#273241] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[#273241] pb-4">
          <Sliders className="w-5 h-5 text-[#1769FF]" />
          <div>
            <h2 className="text-lg font-bold text-white">Appearance & Theme</h2>
            <p className="text-xs text-zinc-400">Choose your preferred visual mode for StockSense (Active: {resolvedTheme.toUpperCase()})</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all text-center ${
              theme === 'light'
                ? 'bg-[#1769FF]/10 border-[#1769FF] text-white shadow-lg shadow-blue-500/10'
                : 'bg-[#070A0E] border-[#273241] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Sun className="w-6 h-6 text-amber-400" />
            <div>
              <p className="font-bold text-sm">Light Mode</p>
              <p className="text-xs text-zinc-500 mt-0.5">High contrast off-white canvas</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all text-center ${
              theme === 'dark'
                ? 'bg-[#1769FF]/10 border-[#1769FF] text-white shadow-lg shadow-blue-500/10'
                : 'bg-[#070A0E] border-[#273241] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Moon className="w-6 h-6 text-[#1769FF]" />
            <div>
              <p className="font-bold text-sm">Dark Mode</p>
              <p className="text-xs text-zinc-500 mt-0.5">Deep slate enterprise surface</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all text-center ${
              theme === 'system'
                ? 'bg-[#1769FF]/10 border-[#1769FF] text-white shadow-lg shadow-blue-500/10'
                : 'bg-[#070A0E] border-[#273241] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Monitor className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="font-bold text-sm">System Default</p>
              <p className="text-xs text-zinc-500 mt-0.5">Matches OS preference</p>
            </div>
          </button>
        </div>
      </div>

      {/* Database Connection Info */}
      <div className="bg-[#0E131A] border border-[#273241] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-[#273241] pb-4">
          <Database className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-lg font-bold text-white">Database & Backend Connectivity</h2>
            <p className="text-xs text-zinc-400">Live Supabase PostgreSQL instance details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#070A0E] border border-[#273241] rounded-xl space-y-1">
            <span className="text-zinc-500 font-semibold uppercase">Supabase Endpoint</span>
            <p className="font-mono text-zinc-200 break-all">https://kkjraxazbrsobqdkwceu.supabase.co</p>
          </div>
          <div className="p-3 bg-[#070A0E] border border-[#273241] rounded-xl space-y-1">
            <span className="text-zinc-500 font-semibold uppercase">Status</span>
            <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Connected & Operational
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
