'use client'

import { useEffect } from 'react'

interface Props {
  title: string
  subtitle?: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, subtitle, open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,13,47,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface-lowest rounded-md p-6 w-full max-w-md mx-4"
        style={{ boxShadow: '0 24px 80px rgba(0,32,91,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            {subtitle && (
              <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-0.5">
                {subtitle}
              </div>
            )}
            <h3 className="font-display font-bold text-lg text-on-surface">{title}</h3>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── Shared form primitives ── */
export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const INPUT_CLS = 'w-full bg-surface-low rounded px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={INPUT_CLS} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={INPUT_CLS} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${INPUT_CLS} resize-none`} />
}

export function ModalActions({
  onClose,
  submitting,
  submitLabel = '신청하기',
}: {
  onClose: () => void
  submitting?: boolean
  submitLabel?: string
}) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="flex-1 py-2 rounded bg-surface-high text-sm font-semibold text-secondary hover:bg-surface-high/80 transition-colors disabled:opacity-50"
      >
        취소
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 py-2 rounded text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}
      >
        {submitting ? '처리 중...' : submitLabel}
      </button>
    </div>
  )
}
