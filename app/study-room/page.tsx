'use client'

import { useEffect, useState } from 'react'
import type { StudyRoomRow, StudySlot } from '@/lib/types'

function todayStr(): string {
  const k = new Date(Date.now() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}`
}

export default function StudyRoomPage() {
  const [rooms, setRooms] = useState<StudyRoomRow[]>([])
  const [roomNumber, setRoomNumber] = useState('')
  const [date, setDate] = useState(todayStr())
  const [slots, setSlots] = useState<StudySlot[]>([])
  const [sel, setSel] = useState<string[]>([])     // 선택한 슬롯 start_time 들 (최대 2 연속)
  const [participants, setParticipants] = useState<{ name: string; email: string }[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const room = rooms.find(r => r.room_number === roomNumber)
  const isGroup = room?.room_type === 'GROUP'

  useEffect(() => {
    fetch('/api/study-room/rooms').then(r => r.json()).then(j => {
      if (j.success) {
        setRooms(j.data)
        const firstActive = j.data.find((r: StudyRoomRow) => r.is_active)
        if (firstActive) setRoomNumber(firstActive.room_number)
      }
    })
  }, [])

  const loadSlots = () => {
    if (!roomNumber || !date) return
    setLoading(true); setSel([])
    fetch(`/api/study-room/slots?room=${roomNumber}&date=${date}`)
      .then(r => r.json()).then(j => { if (j.success) setSlots(j.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadSlots() }, [roomNumber, date])

  // 슬롯 선택: 연속 최대 2개
  const toggleSlot = (start: string) => {
    setMsg('')
    setSel(prev => {
      if (prev.includes(start)) return prev.filter(s => s !== start)
      if (prev.length === 0) return [start]
      if (prev.length >= 2) { setMsg('최대 2시간까지 예약할 수 있습니다.'); return prev }
      // 연속성 체크 (1시간 차이)
      const hours = [...prev, start].map(s => parseInt(s)).sort((a, b) => a - b)
      if (hours[1] - hours[0] !== 1) { setMsg('연속된 시간만 선택할 수 있습니다.'); return prev }
      return [...prev, start]
    })
  }

  const reserve = async () => {
    if (sel.length === 0) { setMsg('시간을 선택해주세요.'); return }
    const hours = sel.map(s => parseInt(s)).sort((a, b) => a - b)
    const start = `${String(hours[0]).padStart(2, '0')}:00`
    const end = `${String(hours[hours.length - 1] + 1).padStart(2, '0')}:00`
    setMsg('')
    const res = await fetch('/api/study-room/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: isGroup ? 'group' : 'individual',
        room_number: roomNumber, date, start, end,
        participants: isGroup ? participants : undefined,
      }),
    })
    const j = await res.json()
    if (!j.success) { setMsg(j.error); return }
    setMsg('✅ 예약 완료! "내 예약"에서 확인하세요.')
    setParticipants([]); loadSlots()
  }

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Study Room</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">스터디룸 예약</h1>
        <p className="text-xs text-secondary mt-1">방·날짜·시간(최대 2시간 연속)을 선택해 예약하세요. 1인 1예약.</p>
      </div>

      {/* 방 선택 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {rooms.map(r => {
          const disabled = !r.is_active
          return (
            <button key={r.id} disabled={disabled} onClick={() => setRoomNumber(r.room_number)}
              className={[
                'px-3 py-2 rounded-lg text-sm font-display font-semibold border transition-all',
                disabled ? 'bg-surface-low text-secondary/50 border-transparent cursor-not-allowed'
                  : roomNumber === r.room_number ? 'bg-[#000d2f] text-white border-transparent'
                  : 'bg-surface-lowest text-on-surface border-surface-high hover:bg-surface-low',
              ].join(' ')}>
              {r.room_number}
              <span className="ml-1.5 text-xs opacity-70">
                {disabled ? '예약 불가' : r.room_type === 'GROUP' ? `그룹·${r.min_participants}~${r.capacity}명` : '개인'}
              </span>
            </button>
          )
        })}
      </div>

      {/* 선택한 방 정보 (위치 + 시설) */}
      {room && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {room.location && <span className="text-xs font-semibold text-on-surface">{room.location}</span>}
          {(room.facilities ?? '').split(',').filter(Boolean).map(f => (
            <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-surface-high text-secondary">{f}</span>
          ))}
          <span className="text-xs text-secondary">운영 {room.open_time}~{room.close_time}</span>
        </div>
      )}

      {/* 날짜 */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs font-semibold text-secondary">날짜</label>
        <input type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)}
          className="bg-surface-low rounded px-3 py-1.5 text-sm text-on-surface outline-none" />
      </div>

      {/* 슬롯 그리드 */}
      <div className="bg-surface-lowest rounded-md p-4 mb-4" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        {loading ? (
          <p className="text-sm text-secondary text-center py-6">불러오는 중...</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {slots.map(s => {
              const selected = sel.includes(s.start_time)
              return (
                <button key={s.start_time} disabled={!s.available && !selected}
                  onClick={() => toggleSlot(s.start_time)}
                  className={[
                    'px-2 py-2.5 rounded-lg text-sm font-medium border transition-all text-center',
                    selected ? 'bg-[#000d2f] text-white border-transparent'
                      : s.available ? 'bg-surface-lowest text-on-surface border-surface-high hover:border-[#00205b]'
                      : 'bg-surface-low text-secondary/50 border-transparent cursor-not-allowed line-through',
                  ].join(' ')}>
                  <div>{s.start_time}~{s.end_time}</div>
                  <div className="text-xs opacity-70 mt-0.5">{s.current}/{s.capacity}</div>
                </button>
              )
            })}
            {slots.length === 0 && <p className="col-span-full text-sm text-secondary text-center py-6">슬롯이 없습니다.</p>}
          </div>
        )}
      </div>

      {/* 그룹 참여자 입력 */}
      {isGroup && (
        <div className="bg-surface-lowest rounded-md p-4 mb-4" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-on-surface">참여자 (예약자 본인 외, 총 {room?.min_participants}~{room?.capacity}명)</span>
            <button onClick={() => setParticipants(p => p.length < (room!.capacity - 1) ? [...p, { name: '', email: '' }] : p)}
              className="text-xs px-2 py-1 rounded bg-surface-high text-on-surface hover:bg-surface-low">+ 참여자</button>
          </div>
          {participants.length === 0 && <p className="text-xs text-secondary">그룹룸은 본인 포함 최소 {room?.min_participants}명이어야 합니다.</p>}
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="이름" value={p.name}
                  onChange={e => setParticipants(arr => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  className="flex-1 bg-surface-low rounded px-2 py-1.5 text-sm outline-none" />
                <input placeholder="이메일" value={p.email}
                  onChange={e => setParticipants(arr => arr.map((x, j) => j === i ? { ...x, email: e.target.value } : x))}
                  className="flex-1 bg-surface-low rounded px-2 py-1.5 text-sm outline-none" />
                <button onClick={() => setParticipants(arr => arr.filter((_, j) => j !== i))}
                  className="px-2 text-secondary hover:text-red-600">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <p className={`text-sm mb-3 ${msg.startsWith('✅') ? 'text-green-600' : 'text-error'}`}>{msg}</p>}

      <button onClick={reserve} disabled={sel.length === 0}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}>
        {sel.length > 0
          ? `${sel.map(s => parseInt(s)).sort((a, b) => a - b)[0]}:00부터 ${sel.length}시간 예약`
          : '시간을 선택하세요'}
      </button>
    </>
  )
}
