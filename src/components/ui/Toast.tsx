import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (type: ToastType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, type, title, message }])
    setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000)
  }, [dismiss])

  const success = useCallback((t: string, m?: string) => toast('success', t, m), [toast])
  const error = useCallback((t: string, m?: string) => toast('error', t, m), [toast])
  const warning = useCallback((t: string, m?: string) => toast('warning', t, m), [toast])
  const info = useCallback((t: string, m?: string) => toast('info', t, m), [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
}

const borders: Record<ToastType, string> = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-up bg-white border-2 border-gray-200 border-l-4 ${borders[t.type]} rounded-xl shadow-hard-sm flex items-start gap-3 px-4 py-3`}
        >
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{t.title}</p>
            {t.message && <p className="text-xs text-gray-500 mt-0.5">{t.message}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="btn-ghost p-1 -mr-1 -mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
