'use client'

import { useEffect, useState } from 'react'
import type { EquipmentRentalRow, EquipmentRentalStatus } from '@/lib/types'

const BADGE: Record<EquipmentRentalStatus, { label: string; cls: string }> = {
  RESERVED: { label: '예약됨',   cls: 'bg-blue-100 text-blue-700' },
  RENTED:   { label: '대여중',   cls: 'bg-success-container text-success' },
  RETURNED: { label: '반납완료', cls: 'bg-surface-high text-secondary' },
  OVERDUE:  { label: '연체',     cls: 'bg-red-100 text-red-700' },
  CANCELLED:{ label: '취소됨',   cls: 'bg-surface-high text-secondary' },
}

export default function MyEquipmentRentalPage() {
  const [rows, setRows] = useState<EquipmentRentalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = () => {
    fetch('/api/equipment-rental/reservations').then(r => r.json())
      .then(j => { if (j.success) setRows(j.data) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const act = async (id: number, action: 'pickup' | 'return') => {
    setMsg('')
    const j = await (await fetch(`/api/equipment-rental/reservations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    })).json()
    setMsg((j.success ? '✅ ' : '⚠️ ') + (j.success ? (action === 'pickup' ? '수령 처리되었습니다.' : '반납 처리되었습니다.') : j.error))
    load()
  }
  const cancel = async (id: number) => {
    if (!confirm('대여 예약을 취소할까요?')) return
    setMsg('')
    const j = await (await fetch(`/api/equipment-rental/reservations/${id}`, { method: 'DELETE' })).json()
    setMsg((j.success ? '✅ 취소되었습니다.' : '⚠️ ' + j.error))
    load()
  }

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Equipment</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">내 대여</h1>
        <p className="text-xs text-secondary mt-1">수령 / 반납 / 취소. 반납일이 지나면 연체로 표시됩니다.</p>
      </div>
      {msg && <p className={`text-sm mb-3 ${msg.startsWith('✅') ? 'text-green-600' : 'text-amber-700'}`}>{msg}</p>}

      <div className="space-y-3">
        {rows.map(r => {
          const badge = BADGE[r.status]
          return (
            <div key={r.id} className="bg-surface-lowest rounded-md p-4" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-on-surface">{r.item_name}</span>
                    <span className="text-xs text-secondary">×{r.qty}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div className="text-sm text-secondary mt-1">{r.start_date} ~ {r.end_date}</div>
                </div>
                <div className="flex gap-1.5">
                  {r.status === 'RESERVED' && <button onClick={() => act(r.id, 'pickup')} className="px-3 py-1.5 rounded text-xs font-semibold bg-[#000d2f] text-white hover:bg-[#00205b]">수령</button>}
                  {(r.status === 'RENTED' || r.status === 'OVERDUE') && <button onClick={() => act(r.id, 'return')} className="px-3 py-1.5 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low">반납</button>}
                  {r.status === 'RESERVED' && <button onClick={() => cancel(r.id)} className="px-3 py-1.5 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100">취소</button>}
                </div>
              </div>
            </div>
          )
        })}
        {!loading && rows.length === 0 && (
          <div className="bg-surface-lowest rounded-md px-6 py-12 text-center text-secondary text-sm" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
            대여 내역이 없습니다.
          </div>
        )}
        {loading && <p className="text-sm text-secondary text-center py-6">불러오는 중...</p>}
      </div>
    </>
  )
}
