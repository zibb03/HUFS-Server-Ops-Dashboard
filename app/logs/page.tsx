'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/lib/admin-context'
import IncidentModal from '@/components/modals/IncidentModal'
import type { IncidentRow } from '@/lib/types'

const STATUS_CFG = {
  processing: { dot: 'bg-amber-500 pulse-dot', badge: 'bg-amber-100 text-amber-700', label: '처리중' },
  done:       { dot: 'bg-success',             badge: 'bg-success-container text-success', label: '완료' },
}

export default function LogsPage() {
  const isAdmin = useAdmin()
  const [incidents, setIncidents] = useState<IncidentRow[]>([])
  const [filter, setFilter] = useState<'all' | 'processing' | 'done'>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<IncidentRow | null>(null)

  const load = () =>
    fetch('/api/incidents?limit=100').then(r => r.json()).then(j => { if (j.success) setIncidents(j.data) })

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.status === filter)

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    load()
  }

  const handleEdit = (inc: IncidentRow) => {
    setEditing(inc)
    setOpen(true)
  }

  const handleDelete = async (inc: IncidentRow) => {
    if (!confirm(`"${inc.title}" 장애 기록을 삭제할까요?`)) return
    const res = await fetch(`/api/incidents/${inc.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) { alert(json.error ?? '삭제 실패'); return }
    load()
  }

  const handleToggleStatus = async (inc: IncidentRow) => {
    const next = inc.status === 'processing' ? 'done' : 'processing'
    const res = await fetch(`/api/incidents/${inc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    const json = await res.json()
    if (!json.success) { alert(json.error ?? '변경 실패'); return }
    load()
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">
            Operations Log
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">장애 대응 로그</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* 필터 */}
          <div className="flex gap-1 bg-surface-lowest rounded-md p-1" style={{ boxShadow: '0 1px 4px rgba(0,32,91,0.06)' }}>
            {(['all', 'processing', 'done'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: filter === f ? 'linear-gradient(135deg, #000d2f, #00205b)' : 'transparent',
                  color: filter === f ? '#fff' : '#4a5568',
                }}
              >
                {{ all: '전체', processing: '처리중', done: '완료' }[f]}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditing(null); setOpen(true) }}
              className="px-4 py-2 rounded text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}
            >
              + 장애 등록
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low">
                {['#', '장애 내용', '발생 일시', '상태', ...(isAdmin ? ['처리'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, i) => {
                const cfg = STATUS_CFG[inc.status] ?? STATUS_CFG.processing
                return (
                  <tr key={inc.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                    <td className="px-4 py-3 text-secondary text-xs font-mono align-top">{inc.id}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-on-surface">{inc.title}</div>
                      {inc.body && (
                        <div className="text-xs text-secondary mt-1 whitespace-pre-wrap">{inc.body}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-secondary align-top">{inc.created_at}</td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleToggleStatus(inc)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-[#000d2f] text-white hover:bg-[#00205b] transition-colors"
                          >
                            {inc.status === 'processing' ? '완료 처리' : '처리중으로'}
                          </button>
                          <button
                            onClick={() => handleEdit(inc)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(inc)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-secondary text-sm">데이터 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IncidentModal open={open} onClose={handleClose} incident={editing} />
    </>
  )
}
