'use client'

import { Fragment, useEffect, useState } from 'react'
import { useAdmin } from '@/lib/admin-context'
import type { CodingZoneSubject, CodingZoneClassRow, CodingZoneRegisterRow } from '@/lib/types'

export default function CodingZoneManagePage() {
  const isAdmin = useAdmin()
  const [subjects, setSubjects] = useState<CodingZoneSubject[]>([])
  const [classes, setClasses] = useState<CodingZoneClassRow[]>([])
  const [msg, setMsg] = useState('')

  // 개설 폼
  const [form, setForm] = useState({
    subject_id: 1, class_name: '', assistant_name: '',
    class_date: '', class_time: '', week_day: '', maximum_number: '10',
  })
  // 명단 보기
  const [openClassId, setOpenClassId] = useState<number | null>(null)
  const [registers, setRegisters] = useState<CodingZoneRegisterRow[]>([])

  const loadSubjects = () =>
    fetch('/api/coding-zone/subjects').then(r => r.json()).then(j => { if (j.success) setSubjects(j.data) })
  const loadClasses = () =>
    fetch('/api/coding-zone/classes?scope=all').then(r => r.json()).then(j => { if (j.success) setClasses(j.data) })

  useEffect(() => { loadSubjects(); loadClasses() }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/coding-zone/classes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, subject_id: Number(form.subject_id), maximum_number: Number(form.maximum_number) }),
    })
    const j = await res.json()
    if (!j.success) { setMsg(j.error); return }
    setForm({ subject_id: 1, class_name: '', assistant_name: '', class_date: '', class_time: '', week_day: '', maximum_number: '10' })
    loadClasses()
  }

  const remove = async (id: number) => {
    if (!confirm('이 수업을 삭제할까요?')) return
    const res = await fetch(`/api/coding-zone/classes/${id}`, { method: 'DELETE' })
    const j = await res.json()
    if (!j.success) { alert(j.error); return }
    loadClasses()
  }

  const openRegisters = async (id: number) => {
    if (openClassId === id) { setOpenClassId(null); return }
    const res = await fetch(`/api/coding-zone/classes/${id}`)
    const j = await res.json()
    if (j.success) { setRegisters(j.data); setOpenClassId(id) }
  }

  const toggle = async (registerId: number, classId: number) => {
    const res = await fetch(`/api/coding-zone/registers/${registerId}`, { method: 'PATCH' })
    const j = await res.json()
    if (!j.success) { alert(j.error); return }
    // 명단 갱신 (펼침 상태 유지)
    const r = await fetch(`/api/coding-zone/classes/${classId}`).then(x => x.json())
    if (r.success) { setRegisters(r.data); setOpenClassId(classId) }
  }

  if (!isAdmin) {
    return (
      <div className="bg-surface-lowest rounded-md px-6 py-16 text-center" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="text-2xl mb-2">🔒</div>
        <h1 className="font-display font-bold text-lg text-on-surface">관리자 전용</h1>
        <p className="text-sm text-secondary mt-1">코딩존 관리는 관리자/조교만 접근할 수 있습니다.</p>
      </div>
    )
  }

  const subjectName = (id: number) => subjects.find(s => s.id === id)?.name ?? `#${id}`

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Coding Zone</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">코딩존 관리</h1>
        <p className="text-xs text-secondary mt-1">수업 개설/삭제, 예약 명단 출석 처리.</p>
      </div>

      {/* 수업 개설 폼 */}
      <form onSubmit={create} className="bg-surface-lowest rounded-md p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <Field label="과목">
          <select value={form.subject_id} onChange={set('subject_id')} className={INPUT}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="수업명"><input value={form.class_name} onChange={set('class_name')} className={INPUT} required /></Field>
        <Field label="조교 이름"><input value={form.assistant_name} onChange={set('assistant_name')} className={INPUT} required /></Field>
        <Field label="정원"><input type="number" min={1} value={form.maximum_number} onChange={set('maximum_number')} className={INPUT} required /></Field>
        <Field label="날짜"><input type="date" value={form.class_date} onChange={set('class_date')} className={INPUT} required /></Field>
        <Field label="시간"><input type="time" value={form.class_time} onChange={set('class_time')} className={INPUT} required /></Field>
        <Field label="요일(선택)"><input value={form.week_day} onChange={set('week_day')} placeholder="월" className={INPUT} /></Field>
        <div className="flex items-end">
          <button type="submit" className="w-full py-2 rounded text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}>+ 수업 개설</button>
        </div>
        {msg && <p className="col-span-full text-xs text-error">{msg}</p>}
      </form>

      {/* 수업 목록 */}
      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low">
                {['과목', '수업명', '조교', '날짜', '시간', '예약', '관리'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((c, i) => (
                <Fragment key={c.id}>
                  <tr className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                    <td className="px-4 py-3 text-secondary text-xs">{subjectName(c.subject_id)}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{c.class_name}</td>
                    <td className="px-4 py-3 text-on-surface">{c.assistant_name}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{c.class_date}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{c.class_time}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{c.current_number}/{c.maximum_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openRegisters(c.id)} className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low transition-colors">{openClassId === c.id ? '닫기' : '명단'}</button>
                        <button onClick={() => remove(c.id)} className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors">삭제</button>
                      </div>
                    </td>
                  </tr>
                  {openClassId === c.id && (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 bg-surface">
                        {registers.length === 0 ? (
                          <p className="text-xs text-secondary">예약자가 없습니다.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead><tr className="text-secondary">
                              {['학번', '이름', '이메일', '출석'].map(h => <th key={h} className="text-left py-1">{h}</th>)}
                            </tr></thead>
                            <tbody>
                              {registers.map(r => (
                                <tr key={r.id}>
                                  <td className="py-1">{r.user_student_num}</td>
                                  <td className="py-1">{r.user_name}</td>
                                  <td className="py-1 text-secondary">{r.user_email}</td>
                                  <td className="py-1">
                                    <button onClick={() => toggle(r.id, c.id)}
                                      className={`px-2 py-0.5 rounded text-xs font-semibold ${r.attended ? 'bg-success-container text-success' : 'bg-surface-high text-secondary'}`}>
                                      {r.attended ? '출석' : '미출석'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {classes.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-secondary text-sm">개설된 수업이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

const INPUT = 'w-full bg-surface-low rounded px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
