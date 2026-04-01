'use client'

import { useEffect, useState } from 'react'
import EquipmentModal from '@/components/modals/EquipmentModal'
import { StatusBadge, ActionButtons, RequestTabs } from '@/components/admin/RequestManage'
import { useAdmin } from '@/lib/admin-context'
import type { EquipmentRequestRow } from '@/lib/types'

export default function EquipmentPage() {
  const isAdmin = useAdmin()
  const [tab, setTab]   = useState<'list' | 'manage'>('list')
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<EquipmentRequestRow[]>([])

  const load = () =>
    fetch('/api/requests/equipment').then(r => r.json()).then(j => { if (j.success) setRows(j.data) })

  useEffect(() => { load() }, [])

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Service</div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">장비 대여</h1>
          <p className="text-xs text-secondary mt-1">학과 보유 기자재를 대여 신청합니다.</p>
        </div>
        {tab === 'list' && (
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}
          >
            + 신청하기
          </button>
        )}
      </div>

      {isAdmin && <RequestTabs active={tab} onChange={setTab} />}

      {tab === 'list' ? (
        <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-low">
                  {['#', '신청자명', '대여 장비', '대여 시작일', '반납 예정일', '신청일'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                    <td className="px-4 py-3 text-secondary text-xs">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{r.applicant_name}</td>
                    <td className="px-4 py-3 text-on-surface">{r.equipment_type}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{r.rental_start}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{r.rental_end}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{r.created_at}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary text-sm">신청 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-low">
                  {['#', '신청자명', '대여 장비', '대여 시작일', '반납 예정일', '상태', '처리'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                    <td className="px-4 py-3 text-secondary text-xs">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{r.applicant_name}</td>
                    <td className="px-4 py-3 text-on-surface">{r.equipment_type}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{r.rental_start}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{r.rental_end}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <ActionButtons id={r.id} status={r.status} apiPath="/api/requests/equipment" onUpdate={load} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-secondary text-sm">신청 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EquipmentModal open={open} onClose={() => { setOpen(false); load() }} />
    </>
  )
}
