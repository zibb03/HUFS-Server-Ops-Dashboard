'use client'

import { useState } from 'react'

export default function StudyCheckInPage() {
  const [token, setToken] = useState('')
  const [result, setResult] = useState<{ ok: boolean; status?: string; name?: string; message: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return
    const res = await fetch('/api/study-room/checkin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: token.trim() }),
    })
    const j = await res.json()
    setResult({ ok: j.success, status: j.status, name: j.name, message: j.message ?? j.error })
  }

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Study Room</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">QR 입실</h1>
        <p className="text-xs text-secondary mt-1">스터디룸 입구 단말기 가정. QR 토큰을 입력하면 입실 처리됩니다. (정시/지각/노쇼 자동 판정)</p>
      </div>

      <div className="bg-surface-lowest rounded-md p-6 max-w-md" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <form onSubmit={submit} className="flex gap-2">
          <input value={token} onChange={e => setToken(e.target.value)} placeholder="QR 토큰 입력 (내 예약에서 복사)"
            className="flex-1 bg-surface-low rounded px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20" />
          <button type="submit" className="px-5 py-2.5 rounded text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}>입실</button>
        </form>

        {result && (
          <div className={`mt-4 px-4 py-4 rounded-lg text-center ${result.ok ? 'bg-success-container' : 'bg-amber-50'}`}>
            <div className="text-3xl mb-1">{result.status === 'ENTRANCE' ? '✅' : result.status === 'LATE' ? '⏰' : result.status === 'NO_SHOW' ? '🚫' : '⚠️'}</div>
            {result.name && <div className="text-sm font-semibold text-on-surface">{result.name}님</div>}
            <div className={`text-sm mt-1 ${result.ok ? 'text-success' : 'text-amber-700'}`}>{result.message}</div>
          </div>
        )}
      </div>
    </>
  )
}
