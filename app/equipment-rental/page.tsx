'use client'

import { useEffect, useState } from 'react'
import type { EquipmentItemAvail } from '@/lib/types'

function todayStr(): string {
  const k = new Date(Date.now() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}`
}

export default function EquipmentRentalPage() {
  const [start, setStart] = useState(todayStr())
  const [end, setEnd] = useState(todayStr())
  const [items, setItems] = useState<EquipmentItemAvail[]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [qty, setQty] = useState('1')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/equipment-rental/catalog?start=${start}&end=${end}`)
      .then(r => r.json()).then(j => { if (j.success) setItems(j.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { if (start && end && end >= start) load() }, [start, end])

  const reserve = async () => {
    if (!sel) { setMsg('기자재를 선택해주세요.'); return }
    setMsg('')
    const res = await fetch('/api/equipment-rental/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: sel, qty: Number(qty), start, end }),
    })
    const j = await res.json()
    if (!j.success) { setMsg(j.error); return }
    setMsg('✅ 대여 예약 완료! "내 대여"에서 확인하세요.')
    setSel(null); setQty('1'); load()
  }

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Equipment</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">기자재 대여</h1>
        <p className="text-xs text-secondary mt-1">대여 기간을 정하고 기자재를 선택해 예약하세요. 연체 시 새 대여가 제한됩니다.</p>
      </div>

      {/* 기간 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-secondary">대여 기간</label>
        <input type="date" value={start} min={todayStr()} onChange={e => setStart(e.target.value)}
          className="bg-surface-low rounded px-3 py-1.5 text-sm text-on-surface outline-none" />
        <span className="text-secondary text-sm">~</span>
        <input type="date" value={end} min={start} onChange={e => setEnd(e.target.value)}
          className="bg-surface-low rounded px-3 py-1.5 text-sm text-on-surface outline-none" />
      </div>

      {/* 카탈로그 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {items.map(it => {
          const soldOut = it.available <= 0
          const selected = sel === it.id
          return (
            <button key={it.id} disabled={soldOut && !selected} onClick={() => setSel(it.id)}
              className={[
                'px-3 py-3 rounded-lg text-left border transition-all',
                selected ? 'bg-[#000d2f] text-white border-transparent'
                  : soldOut ? 'bg-surface-low text-secondary/50 border-transparent cursor-not-allowed'
                  : 'bg-surface-lowest text-on-surface border-surface-high hover:border-[#00205b]',
              ].join(' ')}>
              <div className="font-medium text-sm">{it.name}</div>
              <div className={`text-xs mt-1 ${selected ? 'text-white/70' : 'text-secondary'}`}>
                {soldOut ? '해당 기간 마감' : `가용 ${it.available} / 총 ${it.total_qty}`}
              </div>
            </button>
          )
        })}
        {!loading && items.length === 0 && <p className="col-span-full text-sm text-secondary text-center py-6">기자재가 없습니다.</p>}
      </div>

      {/* 수량 + 예약 */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-secondary">수량</label>
        <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)}
          className="w-20 bg-surface-low rounded px-3 py-2 text-sm text-on-surface outline-none" />
        <button onClick={reserve} disabled={!sel}
          className="px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}>
          {sel ? '이 기자재 대여 예약' : '기자재를 선택하세요'}
        </button>
      </div>
      {msg && <p className={`text-sm mt-3 ${msg.startsWith('✅') ? 'text-green-600' : 'text-error'}`}>{msg}</p>}
    </>
  )
}
