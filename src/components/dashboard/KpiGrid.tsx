import type { DashboardKPIs } from '../../types/inventory'
import { Package, AlertTriangle, XCircle, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface KpiCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  variant: 'blue' | 'orange' | 'red' | 'green'
  subtitle?: string
  loading?: boolean
}

const VARIANT_STYLES = {
  blue: {
    bg: 'bg-[#1769FF]/10',
    icon: 'text-[#1769FF]',
    border: 'border-[#1769FF]/20',
    text: 'text-zinc-900 dark:text-[#F5F7FA]',
  },
  orange: {
    bg: 'bg-[#FF7A00]/10',
    icon: 'text-[#FF7A00]',
    border: 'border-[#FF7A00]/20',
    text: 'text-[#FF7A00]',
  },
  red: {
    bg: 'bg-rose-500/10',
    icon: 'text-rose-500',
    border: 'border-rose-500/20',
    text: 'text-rose-500',
  },
  green: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
    border: 'border-emerald-500/20',
    text: 'text-zinc-900 dark:text-[#F5F7FA]',
  },
}

function KpiCard({ title, value, icon, variant, subtitle, loading }: KpiCardProps) {
  const st = VARIANT_STYLES[variant]
  return (
    <div className="bg-white dark:bg-[#0E131A] border border-zinc-200 dark:border-[#273241] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-500 dark:text-[#94A3B8] uppercase tracking-wider">{title}</span>
        <div className={`w-8 h-8 rounded-xl ${st.bg} ${st.border} border flex items-center justify-center shrink-0`}>
          <div className={st.icon}>{icon}</div>
        </div>
      </div>
      <div>
        {loading ? (
          <div className="h-8 flex items-center"><LoadingSpinner size="sm" /></div>
        ) : (
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${st.text}`}>{value}</p>
        )}
        {subtitle && <p className="text-[11px] text-zinc-400 dark:text-[#94A3B8] mt-1 truncate">{subtitle}</p>}
      </div>
    </div>
  )
}

interface KpiGridProps {
  kpis: DashboardKPIs | null
  loading: boolean
}

export function KpiGrid({ kpis, loading }: KpiGridProps) {
  const cards = [
    {
      title: 'Products in Stock',
      value: kpis?.productsInStock ?? 0,
      icon: <Package className="w-4 h-4" />,
      variant: 'blue' as const,
      subtitle: 'Active SKUs with stock > 0',
    },
    {
      title: 'Low Stock Items',
      value: kpis?.lowStockCount ?? 0,
      icon: <AlertTriangle className="w-4 h-4" />,
      variant: 'orange' as const,
      subtitle: 'At or below reorder point',
    },
    {
      title: 'Out of Stock',
      value: kpis?.outOfStockCount ?? 0,
      icon: <XCircle className="w-4 h-4" />,
      variant: 'red' as const,
      subtitle: 'Zero quantity SKUs',
    },
    {
      title: 'Pending Receipts',
      value: kpis?.pendingReceipts ?? 0,
      icon: <ArrowDownToLine className="w-4 h-4" />,
      variant: 'blue' as const,
      subtitle: 'Draft / Waiting / Ready',
    },
    {
      title: 'Pending Deliveries',
      value: kpis?.pendingDeliveries ?? 0,
      icon: <ArrowUpFromLine className="w-4 h-4" />,
      variant: 'blue' as const,
      subtitle: 'Awaiting dispatch',
    },
    {
      title: 'Scheduled Transfers',
      value: kpis?.scheduledTransfers ?? 0,
      icon: <ArrowLeftRight className="w-4 h-4" />,
      variant: 'blue' as const,
      subtitle: 'Internal movements',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} loading={loading} />
      ))}
    </div>
  )
}
