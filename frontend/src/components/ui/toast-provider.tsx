"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"

type ToastVariant = "success" | "error" | "info" | "warning"

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastRecord = ToastInput & {
  id: number
}

type ToastContextValue = {
  enqueue: (toast: ToastInput) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

type ToastProviderProps = {
  children: ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextIdRef = useRef(1)

  const enqueue = useCallback((toast: ToastInput) => {
    const createdId = nextIdRef.current
    nextIdRef.current += 1

    setToasts((current) => [...current, { ...toast, id: createdId }])
    return createdId
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      enqueue,
      dismiss,
    }),
    [dismiss, enqueue],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div aria-live="polite" className="fixed bottom-4 right-4 flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const role = toast.variant === "error" || toast.variant === "warning" ? "alert" : "status"

          return (
            <div aria-label={toast.title} key={toast.id} role={role}>
              <p>{toast.title}</p>
              {toast.description ? <p>{toast.description}</p> : null}
              <button onClick={() => dismiss(toast.id)} type="button">
                Dismiss
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }

  return context
}
