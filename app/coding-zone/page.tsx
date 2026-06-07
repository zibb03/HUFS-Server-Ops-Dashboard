'use client'

import { useEffect, useState } from 'react'
import type { CodingZoneSubject, CodingZoneClassWithMine } from '@/lib/types'

export default function CodingZonePage() {
  const [subjects, setSubjects] = useState<CodingZoneSubject[]>([])
  const [subjectId, setSubjectId] = useState<number>(1)
  const [classes, setClasses] = useState<CodingZoneClassWithMine[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const loadSubjects = () =>
    fetch('/api/coding-zone/subjects').then(r => r.json()).then(j => { if (j.success) setSubjects(j.data) })

  const loadClasses = (sid: number) => {
    setLoading(true)
    fetch(`/api/coding-zone/classes?subject=${sid}`)
      .then(r => r.json())
      .then(j => { if (j.success) setClasses(j.data); else setMsg(j.error) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSubjects() }, [])
  useEffect(() => { loadClasses(subjectId) }, [subjectId])

  const reserve = async (classId: number) => {
    setMsg('')
    const res = await fetch(`/api/coding-zone/reserve/${classId}`, { method: 'POST' })
    const j = await res.json()
    if (!j.success) { setMsg(j.error); return }
    loadClasses(subjectId)
  }

  const cancel = async (classId: number) => {
    if (!confirm('예약을 취소할까요?')) return
    setMsg('')
    const res = await fetch(`/api/coding-zone/reserve/${classId}`, { method: 'DELETE' })
    const j = await res.json()
    if (!j.success) { setMsg(j.error); return }
    loadClasses(subjectId)
  }

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Coding Zone</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">코딩존 예약</h1>
        <p className="text-xs text-secondary mt-1">다음 주 수업을 예약합니다. (예약 가능 시간: 목 16:00 ~ 일 24:00)</p>
      </div>

      {/* 과목 탭 */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-surface-low w-fit">
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setSubjectId(s.id)}
            className={[
              'px-4 py-1.5 rounded text-sm font-display font-semibold transition-all',
              subjectId === s.id ? 'bg-surface-lowest text-on-surface' : 'text-secondary hover:text-on-surface',
            ].join(' ')}
            style={subjectId === s.id ? { boxShadow: '0 1px 4px rgba(0,13,47,0.08)' } : undefined}
          >
            {s.name}
          </button>
        ))}
      </div>

      {msg && <p className="text-xs text-error mb-3">{msg}</p>}

      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low">
                {['수업명', '조교', '날짜', '시간', '정원', '예약'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((c, i) => {
                const full = c.current_number >= c.maximum_number
                return (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                    <td className="px-4 py-3 font-medium text-on-surface">{c.class_name}</td>
                    <td className="px-4 py-3 text-on-surface">{c.assistant_name}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{c.class_date} ({c.week_day})</td>
                    <td className="px-4 py-3 text-secondary text-xs">{c.class_time}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{c.current_number} / {c.maximum_number}</td>
                    <td className="px-4 py-3">
                      {c.reserved_by_me ? (
                        <button onClick={() => cancel(c.id)} className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors">예약 취소</button>
                      ) : full ? (
                        <span className="text-xs text-secondary">마감</span>
                      ) : (
                        <button onClick={() => reserve(c.id)} className="px-2.5 py-1 rounded text-xs font-semibold bg-[#000d2f] text-white hover:bg-[#00205b] transition-colors">예약</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!loading && classes.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary text-sm">다음 주 수업이 없습니다.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary text-sm">불러오는 중...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
