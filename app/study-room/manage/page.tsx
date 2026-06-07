'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/lib/admin-context'
import type { StudyRoomRow, StudyReservationRow, StudyPenaltyRow } from '@/lib/types'

type Tab = 'rooms' | 'reservations' | 'penalties'

export default function StudyRoomManagePage() {
  const isAdmin = useAdmin()
  const [tab, setTab] = useState<Tab>('reservations')
  const [rooms, setRooms] = useState<StudyRoomRow[]>([])
  const [reservations, setReservations] = useState<StudyReservationRow[]>([])
  const [penalties, setPenalties] = useState<StudyPenaltyRow[]>([])
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    room_number: '', room_type: 'GROUP', capacity: '4', min_participants: '2',
    location: '', facilities: '', open_time: '09:00', close_time: '23:00',
  })

  const loadRooms = () => fetch('/api/study-room/rooms?all=1').then(r => r.json()).then(j => j.success && setRooms(j.data))
  const loadRes = () => fetch('/api/study-room/admin/reservations').then(r => r.json()).then(j => j.success && setReservations(j.data))
  const loadPen = () => fetch('/api/study-room/admin/penalties').then(r => r.json()).then(j => j.success && setPenalties(j.data))

  useEffect(() => { if (isAdmin) { loadRooms(); loadRes(); loadPen() } }, [isAdmin])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('')
    const j = await (await fetch('/api/study-room/rooms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, capacity: Number(form.capacity), min_participants: Number(form.min_participants) }),
    })).json()
    if (!j.success) { setMsg(j.error); return }
    setForm({ room_number: '', room_type: 'GROUP', capacity: '4', min_participants: '2', location: '', facilities: '', open_time: '09:00', close_time: '23:00' })
    loadRooms()
  }
  const toggleRoom = async (num: string, active: boolean) => {
    await fetch(`/api/study-room/rooms/${num}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: active }),
    })
    loadRooms()
  }
  const forceCancel = async (id: number) => {
    if (!confirm('이 예약을 강제 취소할까요?')) return
    await fetch(`/api/study-room/admin/reservations/${id}`, { method: 'DELETE' })
    loadRes()
  }
  const clearPenalty = async (id: number) => {
    await fetch(`/api/study-room/admin/penalties/${id}`, { method: 'PATCH' })
    loadPen()
  }

  if (!isAdmin) {
    return (
      <div className="bg-surface-lowest rounded-md px-6 py-16 text-center" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="text-2xl mb-2">🔒</div>
        <h1 className="font-display font-bold text-lg text-on-surface">관리자 전용</h1>
        <p className="text-sm text-secondary mt-1">스터디룸 관리는 관리자 모드에서 접근하세요.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Study Room</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">스터디룸 관리</h1>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-surface-low w-fit">
        {([['reservations', '전체 예약'], ['rooms', '방 관리'], ['penalties', '패널티']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={['px-4 py-1.5 rounded text-sm font-display font-semibold transition-all',
              tab === t ? 'bg-surface-lowest text-on-surface' : 'text-secondary hover:text-on-surface'].join(' ')}
            style={tab === t ? { boxShadow: '0 1px 4px rgba(0,13,47,0.08)' } : undefined}>{label}</button>
        ))}
      </div>
      {msg && <p className="text-xs text-error mb-3">{msg}</p>}

      {/* 전체 예약 */}
      {tab === 'reservations' && (
        <Card>
          <Table head={['방', '유형', '날짜', '시간', '예약자', '상태', '']}>
            {reservations.map((r, i) => (
              <tr key={r.id} className={i % 2 ? 'bg-surface' : 'bg-surface-lowest'}>
                <Td>{r.room_number}</Td><Td>{r.room_type === 'GROUP' ? '그룹' : '개인'}</Td>
                <Td muted>{r.schedule_date}</Td><Td muted>{r.start_time}~{r.end_time}</Td>
                <Td>{r.user_name}{!r.is_holder && <span className="text-xs text-secondary"> (참여)</span>}</Td>
                <Td><span className="text-xs">{r.status}</span></Td>
                <Td>{r.status !== 'CANCELLED' && r.is_holder && (
                  <button onClick={() => forceCancel(r.id)} className="px-2 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100">강제취소</button>
                )}</Td>
              </tr>
            ))}
            {reservations.length === 0 && <tr><Td colSpan={7} center>예약 없음</Td></tr>}
          </Table>
        </Card>
      )}

      {/* 방 관리 */}
      {tab === 'rooms' && (
        <>
          <form onSubmit={createRoom} className="bg-surface-lowest rounded-md p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
            <F label="방 번호"><input value={form.room_number} onChange={set('room_number')} className={INP} required /></F>
            <F label="유형"><select value={form.room_type} onChange={set('room_type')} className={INP}><option value="GROUP">그룹</option><option value="INDIVIDUAL">개인</option></select></F>
            <F label="정원"><input type="number" min={1} value={form.capacity} onChange={set('capacity')} className={INP} /></F>
            <F label="최소인원"><input type="number" min={1} value={form.min_participants} onChange={set('min_participants')} className={INP} /></F>
            <F label="위치"><input value={form.location} onChange={set('location')} className={INP} placeholder="3층" /></F>
            <F label="시설(쉼표)"><input value={form.facilities} onChange={set('facilities')} className={INP} placeholder="PC,화이트보드" /></F>
            <F label="오픈"><input type="time" value={form.open_time} onChange={set('open_time')} className={INP} /></F>
            <F label="마감"><input type="time" value={form.close_time} onChange={set('close_time')} className={INP} /></F>
            <div className="flex items-end"><button type="submit" className="w-full py-2 rounded text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}>+ 방 추가</button></div>
          </form>
          <Card>
            <Table head={['방', '유형', '정원', '인원', '위치', '시설', '운영', '상태', '']}>
              {rooms.map((r, i) => (
                <tr key={r.id} className={i % 2 ? 'bg-surface' : 'bg-surface-lowest'}>
                  <Td>{r.room_number}</Td><Td>{r.room_type === 'GROUP' ? '그룹' : '개인'}</Td>
                  <Td muted>{r.capacity}</Td><Td muted>{r.min_participants}~{r.capacity}</Td>
                  <Td muted>{r.location}</Td><Td muted>{r.facilities}</Td><Td muted>{r.open_time}~{r.close_time}</Td>
                  <Td>{r.is_active ? <span className="text-xs text-success">운영중</span> : <span className="text-xs text-secondary">중지</span>}</Td>
                  <Td><button onClick={() => toggleRoom(r.room_number, !r.is_active)} className="px-2 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low">{r.is_active ? '중지' : '재개'}</button></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}

      {/* 패널티 */}
      {tab === 'penalties' && (
        <Card>
          <Table head={['사용자ID', '사유', '해제일', '상태', '']}>
            {penalties.map((p, i) => (
              <tr key={p.id} className={i % 2 ? 'bg-surface' : 'bg-surface-lowest'}>
                <Td>{p.user_id}</Td><Td>{p.reason}</Td><Td muted>{p.penalty_end}</Td>
                <Td><span className={`text-xs ${p.status === 'VALID' ? 'text-red-600' : 'text-secondary'}`}>{p.status}</span></Td>
                <Td>{p.status === 'VALID' && <button onClick={() => clearPenalty(p.id)} className="px-2 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low">해제</button>}</Td>
              </tr>
            ))}
            {penalties.length === 0 && <tr><Td colSpan={5} center>패널티 없음</Td></tr>}
          </Table>
        </Card>
      )}
    </>
  )
}

const INP = 'w-full bg-surface-low rounded px-3 py-2 text-sm text-on-surface outline-none'
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wide">{label}</label>{children}</div>
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}><div className="overflow-x-auto">{children}</div></div>
}
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-surface-low">{head.map((h, i) => <th key={i} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  )
}
function Td({ children, muted, center, colSpan }: { children?: React.ReactNode; muted?: boolean; center?: boolean; colSpan?: number }) {
  return <td colSpan={colSpan} className={['px-4 py-3', muted ? 'text-secondary text-xs' : 'text-on-surface', center ? 'text-center py-8 text-secondary' : ''].join(' ')}>{children}</td>
}
