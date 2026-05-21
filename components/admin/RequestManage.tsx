'use client'

import type { RequestStatus } from '@/lib/types'

/* ── 상태 배지 ── */
const STATUS_META: Record<RequestStatus, { label: string; className: string }> = {
  pending:    { label: '대기중',  className: 'bg-amber-50 text-amber-700' },
  approved:   { label: '승인',    className: 'bg-green-50 text-green-700' },
  rejected:   { label: '거절',    className: 'bg-red-50 text-red-700' },
  processing: { label: '처리중',  className: 'bg-blue-50 text-blue-700' },
  completed:  { label: '완료',    className: 'bg-surface-high text-secondary' },
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.pending
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.className}`}>
      {m.label}
    </span>
  )
}

/* ── 액션 버튼 ── */
type Action = {
  label: string
  next: RequestStatus
  style: 'primary' | 'danger' | 'ghost'
  confirm?: string  // confirm 다이얼로그 메시지 (있으면 클릭 시 확인)
}

function getActions(status: RequestStatus, isMaintenance = false): Action[] {
  switch (status) {
    case 'pending':
      return [
        { label: '승인', next: 'approved', style: 'primary' },
        { label: '거절', next: 'rejected', style: 'danger', confirm: '이 신청을 거절할까요?' },
      ]
    case 'approved':
      return isMaintenance
        ? [
            { label: '처리중',   next: 'processing', style: 'ghost' },
            { label: '거절',     next: 'rejected',   style: 'danger', confirm: '이 신청을 거절할까요?' },
            { label: '승인취소', next: 'pending',    style: 'ghost' },
          ]
        : [
            { label: '완료',     next: 'completed', style: 'ghost', confirm: '완료 처리할까요?' },
            { label: '거절',     next: 'rejected',  style: 'danger', confirm: '이 신청을 거절할까요?' },
            { label: '승인취소', next: 'pending',   style: 'ghost' },
          ]
    case 'processing':
      return [
        { label: '처리완료', next: 'completed', style: 'primary', confirm: '처리 완료로 변경할까요?' },
        { label: '취소',     next: 'approved',  style: 'ghost' },
      ]
    case 'rejected':
      return [{ label: '재승인', next: 'approved', style: 'ghost' }]
    default:
      return []
  }
}

const BTN_STYLE: Record<Action['style'], string> = {
  primary: 'bg-[#000d2f] text-white hover:bg-[#00205b]',
  danger:  'bg-red-50 text-red-700 hover:bg-red-100',
  ghost:   'bg-surface-high text-on-surface hover:bg-surface-low',
}

interface ActionButtonsProps {
  id: number
  status: RequestStatus
  apiPath: string
  isMaintenance?: boolean
  onUpdate: () => void
}

export function ActionButtons({ id, status, apiPath, isMaintenance, onUpdate }: ActionButtonsProps) {
  const actions = getActions(status, isMaintenance)
  if (actions.length === 0) return <span className="text-xs text-secondary">—</span>

  const handleClick = async (action: Action) => {
    if (action.confirm && !confirm(action.confirm)) return
    await fetch(`${apiPath}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action.next }),
    })
    onUpdate()
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {actions.map(a => (
        <button
          key={a.next}
          onClick={() => handleClick(a)}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${BTN_STYLE[a.style]}`}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}

/* ── 탭 헤더 ── */
export function RequestTabs({
  active,
  onChange,
}: {
  active: 'list' | 'manage'
  onChange: (t: 'list' | 'manage') => void
}) {
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-lg bg-surface-low w-fit">
      {([['list', '신청 현황'], ['manage', '요청 관리']] as const).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={[
            'px-4 py-1.5 rounded text-sm font-display font-semibold transition-all',
            active === key
              ? 'bg-surface-lowest text-on-surface'
              : 'text-secondary hover:text-on-surface',
          ].join(' ')}
          style={active === key ? { boxShadow: '0 1px 4px rgba(0,13,47,0.08)' } : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
