'use client'

import { useEffect, useState } from 'react'
import type { StudyReservationGroup, StudyPenaltyRow, StudyReservationStatus } from '@/lib/types'

const STATUS_BADGE: Record<StudyReservationStatus, { label: string; cls: string }> = {
  RESERVED:  { label: '예약됨',   cls: 'bg-blue-100 text-blue-700' },
  ENTRANCE:  { label: '입실(정시)', cls: 'bg-success-container text-success' },
  LATE:      { label: '입실(지각)', cls: 'bg-amber-100 text-amber-700' },
  NO_SHOW:   { label: '노쇼',     cls: 'bg-red-100 text-red-700' },
  COMPLETED: { label: '완료',     cls: 'bg-surface-high text-secondary' },
  CANCELLED: { label: '취소됨',   cls: 'bg-surface-high text-secondary' },
}

export default function MyStudyRoomPage() {
  const [rows, setRows] = useState<StudyReservationGroup[]>([])
  const [penalties, setPenalties] = useState<StudyPenaltyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = () => {
    Promise.all([
      fetch('/api/study-room/reservations').then(r => r.json()),
      fetch('/api/study-room/penalties').then(r => r.json()),
    ]).then(([res, pen]) => {
      if (res.success) setRows(res.data)
      if (pen.success) setPenalties(pen.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const checkIn = async (token: string | null) => {
    if (!token) return
    setMsg('')
    const res = await fetch('/api/study-room/checkin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: token }),
    })
    const j = await res.json()
    setMsg((j.success ? '✅ ' : '⚠️ ') + j.message)
    load()
  }
  const cancel = async (id: number) => {
    if (!confirm('예약을 취소할까요? (시작 1시간 이내면 패널티)')) return
    setMsg('')
    const j = await (await fetch(`/api/study-room/reservations/${id}`, { method: 'DELETE' })).json()
    setMsg((j.success ? '✅ ' : '⚠️ ') + (j.message ?? (j.success ? '취소되었습니다.' : j.error)))
    load()
  }
  const extend = async (id: number) => {
    setMsg('')
    const j = await (await fetch(`/api/study-room/reservations/${id}`, { method: 'PATCH' })).json()
    setMsg((j.success ? '✅ 1시간 연장되었습니다.' : '⚠️ ' + j.error))
    load()
  }

  const activePenalty = penalties.find(p => p.status === 'VALID')

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Study Room</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">내 예약</h1>
        <p className="text-xs text-secondary mt-1">QR 입실 / 취소 / 연장. 패널티 상태도 확인하세요.</p>
      </div>

      {activePenalty && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 font-medium">⛔ 패널티 적용 중 — {activePenalty.reason} (해제: {activePenalty.penalty_end})</p>
        </div>
      )}
      {msg && <p className={`text-sm mb-3 ${msg.startsWith('✅') ? 'text-green-600' : 'text-amber-700'}`}>{msg}</p>}

      <div className="space-y-3">
        {rows.map(r => {
          const badge = STATUS_BADGE[r.status]
          const canCheckIn = r.status === 'RESERVED' && r.qr_token
          const canExtend = r.status === 'ENTRANCE' || r.status === 'LATE'
          const canCancel = r.status === 'RESERVED'
          return (
            <div key={r.id} className="bg-surface-lowest rounded-md p-4" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-on-surface">{r.room_number}호</span>
                    <span className="text-xs text-secondary">{r.room_type === 'GROUP' ? '그룹' : '개인'}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div className="text-sm text-secondary mt-1">{r.schedule_date} · {r.start_time}~{r.end_time}</div>
                  {r.room_type === 'GROUP' && (
                    <div className="text-xs text-secondary mt-1">
                      참여자: {r.participants.map(p => p.name).join(', ')}
                    </div>
                  )}
                  {r.qr_token && r.status === 'RESERVED' && (
                    <div className="text-xs text-secondary mt-1 font-mono">QR 토큰: {r.qr_token}</div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {canCheckIn && <button onClick={() => checkIn(r.qr_token)} className="px-3 py-1.5 rounded text-xs font-semibold bg-[#000d2f] text-white hover:bg-[#00205b]">QR 입실</button>}
                  {canExtend && <button onClick={() => extend(r.id)} className="px-3 py-1.5 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low">연장 +1h</button>}
                  {canCancel && <button onClick={() => cancel(r.id)} className="px-3 py-1.5 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100">취소</button>}
                </div>
              </div>
            </div>
          )
        })}
        {!loading && rows.length === 0 && (
          <div className="bg-surface-lowest rounded-md px-6 py-12 text-center text-secondary text-sm" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
            예약 내역이 없습니다.
          </div>
        )}
        {loading && <p className="text-sm text-secondary text-center py-6">불러오는 중...</p>}
      </div>
    </>
  )
}
