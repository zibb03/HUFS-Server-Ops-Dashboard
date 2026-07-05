'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/lib/admin-context'
import type { EquipmentRentalRow } from '@/lib/types'

export default function EquipmentRentalManagePage() {
  const isAdmin = useAdmin()
  const [rows, setRows] = useState<EquipmentRentalRow[]>([])

  const load = () => fetch('/api/equipment-rental/admin/reservations').then(r => r.json()).then(j => j.success && setRows(j.data))
  useEffect(() => { if (isAdmin) load() }, [isAdmin])

  const forceReturn = async (id: number) => {
    if (!confirm('강제 반납/취소 처리할까요?')) return
    await fetch(`/api/equipment-rental/admin/reservations/${id}`, { method: 'DELETE' })
    load()
  }

  if (!isAdmin) {
    return (
      <div className="bg-surface-lowest rounded-md px-6 py-16 text-center" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="text-2xl mb-2">🔒</div>
        <h1 className="font-display font-bold text-lg text-on-surface">관리자 전용</h1>
        <p className="text-sm text-secondary mt-1">기자재 대여 관리는 관리자 모드에서 접근하세요.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Equipment</div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">기자재 대여 관리</h1>
          <p className="text-xs text-secondary mt-1">전체 대여 현황 · 강제 반납/취소. 기자재 품목은 <Link href="/equipment" className="underline">장비 관리</Link>에서.</p>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low">
                {['기자재', '수량', '기간', '대여자', '상태', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={i % 2 ? 'bg-surface' : 'bg-surface-lowest'}>
                  <td className="px-4 py-3 font-medium text-on-surface">{r.item_name}</td>
                  <td className="px-4 py-3 text-secondary text-xs">×{r.qty}</td>
                  <td className="px-4 py-3 text-secondary text-xs">{r.start_date}~{r.end_date}</td>
                  <td className="px-4 py-3 text-on-surface">{r.user_name}</td>
                  <td className="px-4 py-3"><span className={`text-xs ${r.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-secondary'}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    {(r.status === 'RESERVED' || r.status === 'RENTED' || r.status === 'OVERDUE') && (
                      <button onClick={() => forceReturn(r.id)} className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100">강제 반납/취소</button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary text-sm">대여 내역이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
