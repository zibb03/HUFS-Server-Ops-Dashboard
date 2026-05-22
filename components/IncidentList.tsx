import Link from 'next/link'
import type { IncidentRow } from '@/lib/types'

const DEFAULTS: IncidentRow[] = [
  { id: 1, title: '학과 네트워크 지연',             body: null, status: 'processing', created_at: '2024-05-22 09:15' },
  { id: 2, title: '프린터 클라이언트 #4 오프라인',  body: null, status: 'processing', created_at: '2024-05-21 14:30' },
  { id: 3, title: '무단 로그인 시도 5회 차단',       body: null, status: 'done',       created_at: '2024-05-20 22:44' },
  { id: 4, title: 'DB 서버 응답 지연 해결',          body: null, status: 'done',       created_at: '2024-05-19 18:10' },
]

const STATUS_CONFIG = {
  processing: { dot: 'bg-amber-500 pulse-dot', badge: 'bg-amber-100 text-amber-700', label: '처리중' },
  done:       { dot: 'bg-success',             badge: 'bg-success-container text-success', label: '완료' },
}

interface Props { data?: IncidentRow[] }

export default function IncidentList({ data = DEFAULTS }: Props) {
  return (
    <div
      className="bg-surface-lowest rounded-md p-5 transition-all duration-200 hover:-translate-y-px"
      style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-0.5">
            Operations
          </div>
          <h2 className="font-display font-bold text-base text-on-surface">장애 대응 현황</h2>
        </div>
        <Link href="/logs" className="text-xs text-primary hover:underline">로그 보기</Link>
      </div>

      <div className="space-y-2">
        {data.map((incident) => {
          const cfg = STATUS_CONFIG[incident.status] ?? STATUS_CONFIG.processing
          return (
            <div key={incident.id} className="flex items-start gap-3 p-3 bg-surface-low rounded-md">
              <span className={`flex-shrink-0 w-2 h-2 mt-1.5 rounded-full ${cfg.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-on-surface truncate">{incident.title}</span>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="text-xs text-secondary mt-0.5">{incident.created_at}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
