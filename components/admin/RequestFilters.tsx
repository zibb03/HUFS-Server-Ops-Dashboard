'use client'

import type { RequestStatus } from '@/lib/types'

export type StatusFilter = 'all' | RequestStatus
export type SortOrder = 'newest' | 'oldest'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  sort: SortOrder
  onSortChange: (v: SortOrder) => void
  includeProcessing?: boolean  // 유지보수: processing 상태 포함
}

export function RequestFilters({
  search, onSearchChange,
  status, onStatusChange,
  sort, onSortChange,
  includeProcessing,
}: Props) {
  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '대기중' },
    { value: 'approved', label: '승인' },
    ...(includeProcessing ? [{ value: 'processing' as const, label: '처리중' }] : []),
    { value: 'rejected', label: '거절' },
    { value: 'completed', label: '완료' },
  ]

  const inputCls =
    'px-3 py-1.5 rounded bg-surface-lowest text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20'
  const shadow = { boxShadow: '0 1px 4px rgba(0,32,91,0.06)' }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <input
        type="text"
        placeholder="신청자명 검색"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className={`${inputCls} w-48`}
        style={shadow}
      />
      <select
        value={status}
        onChange={e => onStatusChange(e.target.value as StatusFilter)}
        className={inputCls}
        style={shadow}
      >
        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select
        value={sort}
        onChange={e => onSortChange(e.target.value as SortOrder)}
        className={inputCls}
        style={shadow}
      >
        <option value="newest">최신순</option>
        <option value="oldest">오래된순</option>
      </select>
    </div>
  )
}

export function Pagination({
  page, totalPages, onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const btn = 'px-3 py-1 rounded text-xs font-semibold bg-surface-lowest text-on-surface hover:bg-surface-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} className={btn}>← 이전</button>
      <span className="text-xs text-secondary px-2">{page} / {totalPages}</span>
      <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className={btn}>다음 →</button>
    </div>
  )
}
