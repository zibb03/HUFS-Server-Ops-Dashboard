'use client'

import { useEffect, useState } from 'react'
import PrinterModal from '@/components/modals/PrinterModal'
import { StatusBadge, ActionButtons, RequestTabs } from '@/components/admin/RequestManage'
import { useAdmin } from '@/lib/admin-context'
import type { PrinterRequestRow } from '@/lib/types'

export default function PrinterPage() {
  const isAdmin = useAdmin()
  const [tab, setTab]   = useState<'list' | 'manage'>('list')
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<PrinterRequestRow[]>([])

  const load = () =>
    fetch('/api/requests/printer').then(r => r.json()).then(j => { if (j.success) setRows(j.data) })

  useEffect(() => { load() }, [])

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">Service</div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">프린터 요청</h1>
          <p className="text-xs text-secondary mt-1">프린터 사용을 신청합니다.</p>
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
                  {['#', '신청자명', '프린터', '출력 매수', '신청일'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                    <td className="px-4 py-3 text-secondary text-xs">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{r.applicant_name}</td>
                    <td className="px-4 py-3 text-on-surface">{r.printer_id}</td>
                    <td className="px-4 py-3 text-on-surface">{r.copies}매</td>
                    <td className="px-4 py-3 text-secondary text-xs">{r.created_at}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary text-sm">신청 내역이 없습니다.</td></tr>
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
                  {['#', '신청자명', '프린터', '출력 매수', '상태', '처리'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                    <td className="px-4 py-3 text-secondary text-xs">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{r.applicant_name}</td>
                    <td className="px-4 py-3 text-on-surface">{r.printer_id}</td>
                    <td className="px-4 py-3 text-on-surface">{r.copies}매</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <ActionButtons id={r.id} status={r.status} apiPath="/api/requests/printer" onUpdate={load} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary text-sm">신청 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PrinterModal open={open} onClose={() => { setOpen(false); load() }} />
    </>
  )
}
