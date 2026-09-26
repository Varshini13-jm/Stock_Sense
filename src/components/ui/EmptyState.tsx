import type { ReactNode, ComponentType } from 'react'

interface EmptyStateProps {
  icon?: ReactNode | ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, action, actionLabel, onAction }: EmptyStateProps) {
  const isComponent = typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon && !('props' in icon))
  const IconComp = isComponent ? (icon as ComponentType<{ className?: string }>) : null

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
      {icon && (
        <div className="p-4 bg-zinc-100 dark:bg-[#151B23] border border-zinc-200 dark:border-[#273241] rounded-2xl text-zinc-500 dark:text-[#94A3B8]">
          {IconComp ? <IconComp className="w-6 h-6" /> : (icon as ReactNode)}
        </div>
      )}
      <div>
        <h3 className="text-sm font-bold text-zinc-800 dark:text-[#F5F7FA]">{title}</h3>
        {description && <p className="text-xs text-zinc-500 dark:text-[#94A3B8] mt-1 max-w-sm">{description}</p>}
      </div>
      {action ? (
        <div className="mt-2">{action}</div>
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-3.5 py-1.5 bg-[#1769FF] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-600 transition-colors"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center space-y-3">
      <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-xs font-semibold text-rose-500 max-w-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3.5 py-1.5 bg-[#1769FF] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-600 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}
