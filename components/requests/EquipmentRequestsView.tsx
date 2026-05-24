'use client'

import { useEffect, useMemo, useState } from 'react'
import EquipmentModal from '@/components/modals/EquipmentModal'
import { StatusBadge, ActionButtons, RequestTabs } from '@/components/admin/RequestManage'
import { RequestFilters, Pagination, type StatusFilter, type SortOrder } from '@/components/admin/RequestFilters'
import { useAdmin } from '@/lib/admin-context'
import { downloadCsv, todayLocal } from '@/lib/csv'
import type { EquipmentRequestRow, RequestStatus } from '@/lib/types'

const PAGE_SIZE = 20

interface Props { initialRows: EquipmentRequestRow[] }

export default function EquipmentRequestsView({ initialRows }: Props) {
  const isAdmin = useAdmin()
  const [tab, setTab]   = useState<'list' | 'manage'>('list')
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<EquipmentRequestRow[]>(initialRows)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOrder>('newest')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // 첫 화면은 SSR initialRows로 즉시 표시. 변경 후엔 client fetch로 갱신.
  const load = () =>
    fetch('/api/requests/equipment').then(r => r.json()).then(j => { if (j.success) setRows(j.data) })

  const filtered = useMemo(() => {
    let xs = rows
    if (statusFilter !== 'all') xs = xs.filter(r => r.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      xs = xs.filter(r => r.applicant_name.toLowerCase().includes(q))
    }
    xs = [...xs].sort((a, b) =>
      sort === 'newest' ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at),
    )
    return xs
  }, [rows, statusFilter, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { setPage(1) }, [search, statusFilter, sort, tab])

  const allOnPageSelected = paged.length > 0 && paged.every(r => selected.has(r.id))
  const toggleOne = (id: number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const toggleAllOnPage = () => {
    const next = new Set(selected)
    if (allOnPageSelected) paged.forEach(r => next.delete(r.id))
    else paged.forEach(r => next.add(r.id))
    setSelected(next)
  }

  const handleBulk = async (newStatus: RequestStatus) => {
    if (selected.size === 0) return
    const label = newStatus === 'approved' ? '승인' : '거절'
    if (!confirm(`선택한 ${selected.size}건을 일괄 ${label}할까요?`)) return
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/requests/equipment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    ))
    setSelected(new Set())
    load()
  }

  const handleCsv = () => {
    downloadCsv(`equipment_requests_${todayLocal()}.csv`, filtered, [
      { key: 'id', label: '번호' },
      { key: 'applicant_name', label: '신청자명' },
      { key: 'equipment_type', label: '대여 장비' },
      { key: 'rental_start', label: '대여 시작일' },
      { key: 'rental_end', label: '반납 예정일' },
      { key: 'status', label: '상태' },
      { key: 'reject_reason', label: '반려 사유' },
      { key: 'created_at', label: '신청일' },
    ])
  }

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

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <RequestFilters
          search={search} onSearchChange={setSearch}
          status={statusFilter} onStatusChange={setStatusFilter}
          sort={sort} onSortChange={setSort}
        />
        <div className="flex items-center gap-2">
          {tab === 'manage' && isAdmin && selected.size > 0 && (
            <>
              <span className="text-xs text-secondary">선택 {selected.size}건</span>
              <button onClick={() => handleBulk('approved')} className="px-3 py-1.5 rounded text-xs font-semibold bg-[#000d2f] text-white hover:bg-[#00205b] transition-colors">
                일괄 승인
              </button>
              <button onClick={() => handleBulk('rejected')} className="px-3 py-1.5 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                일괄 거절
              </button>
            </>
          )}
          <button onClick={handleCsv} className="px-3 py-1.5 rounded text-xs font-semibold bg-surface-lowest text-on-surface hover:bg-surface-low transition-colors" style={{ boxShadow: '0 1px 4px rgba(0,32,91,0.06)' }}>
            CSV 내보내기
          </button>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low">
                {tab === 'manage' && isAdmin && (
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
                  </th>
                )}
                {['#', '신청자명', '대여 장비', '대여 시작일', '반납 예정일', '신청일', ...(tab === 'manage' ? ['상태', '처리'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                  {tab === 'manage' && isAdmin && (
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} />
                    </td>
                  )}
                  <td className="px-4 py-3 text-secondary text-xs">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-on-surface">
                    {r.applicant_name}
                    {r.status === 'rejected' && r.reject_reason && (
                      <div className="text-xs text-red-700 mt-1">반려: {r.reject_reason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-on-surface">{r.equipment_type}</td>
                  <td className="px-4 py-3 text-secondary text-xs">{r.rental_start}</td>
                  <td className="px-4 py-3 text-secondary text-xs">{r.rental_end}</td>
                  <td className="px-4 py-3 text-secondary text-xs">{r.created_at}</td>
                  {tab === 'manage' && (
                    <>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        <ActionButtons id={r.id} status={r.status} apiPath="/api/requests/equipment" onUpdate={load} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={tab === 'manage' && isAdmin ? 9 : 6} className="px-4 py-8 text-center text-secondary text-sm">신청 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      <EquipmentModal open={open} onClose={() => { setOpen(false); load() }} />
    </>
  )
}
