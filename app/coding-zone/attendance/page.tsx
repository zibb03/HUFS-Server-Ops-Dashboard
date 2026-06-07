'use client'

import { useEffect, useState } from 'react'
import type { CodingZoneMyReservation } from '@/lib/types'

export default function MyAttendancePage() {
  const [rows, setRows] = useState<CodingZoneMyReservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coding-zone/my')
      .then(r => r.json())
      .then(j => { if (j.success) setRows(j.data) })
      .finally(() => setLoading(false))
  }, [])

  // 출석 횟수: 출석(true) 건수
  const attendedCount = rows.filter(r => r.attended).length

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Coding Zone</div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">내 출석 현황</h1>
        <p className="text-xs text-secondary mt-1">총 출석 {attendedCount}회 · 예약 {rows.length}건</p>
      </div>

      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low">
                {['수업명', '조교', '날짜', '시간', '출석'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                  <td className="px-4 py-3 font-medium text-on-surface">{r.class_name}</td>
                  <td className="px-4 py-3 text-on-surface">{r.assistant_name}</td>
                  <td className="px-4 py-3 text-secondary text-xs">{r.class_date}</td>
                  <td className="px-4 py-3 text-secondary text-xs">{r.class_time}</td>
                  <td className="px-4 py-3">
                    {r.attended ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-success-container text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />출석
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />예약됨
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary text-sm">예약 내역이 없습니다.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary text-sm">불러오는 중...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
