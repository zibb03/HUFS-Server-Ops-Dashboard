import Link from 'next/link'
import type { NoticeRow } from '@/lib/types'

const DEFAULTS: NoticeRow[] = [
  { id: 1, title: '전체 서버 통합 업그레이드 프로그램 시작',             body: null, type: 'notice',  is_public: true, created_at: '2024-05-22' },
  { id: 2, title: '보안 강화를 위한 새로운 네트워크 보안 프로토콜 적용', body: null, type: 'notice',  is_public: true, created_at: '2024-05-22' },
  { id: 3, title: '서버실 출입 시 각 층 증명에 대한 업데이트 지침',      body: null, type: 'info',    is_public: true, created_at: '2024-05-21' },
  { id: 4, title: '2024년 2분기 서버 정기 점검 일정 안내',               body: null, type: 'general', is_public: true, created_at: '2024-05-18' },
]

const TYPE_CONFIG = {
  notice:  { label: '공지', className: 'bg-primary/10 text-primary' },
  info:    { label: '안내', className: 'bg-amber-100 text-amber-700' },
  general: { label: '일반', className: 'bg-surface-high text-secondary' },
}

interface Props { data?: NoticeRow[] }

export default function NoticeList({ data = DEFAULTS }: Props) {
  return (
    <div
      className="bg-surface-lowest rounded-md p-5 transition-all duration-200 hover:-translate-y-px"
      style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-0.5">
            Announcements
          </div>
          <h2 className="font-display font-bold text-base text-on-surface">공지사항</h2>
        </div>
        <Link href="/notices" className="text-xs text-primary hover:underline">전체 보기</Link>
      </div>

      <div>
        {data.map((notice, i) => {
          const cfg = TYPE_CONFIG[notice.type] ?? TYPE_CONFIG.general
          return (
            <div
              key={notice.id}
              className="flex items-start gap-3 py-3"
              style={{ borderBottom: i < data.length - 1 ? '1px solid #f2f4f6' : 'none' }}
            >
              <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded mt-0.5 ${cfg.className}`}>
                {cfg.label}
              </span>
              <div>
                <div className="text-sm font-medium text-on-surface">{notice.title}</div>
                <div className="text-xs text-secondary mt-0.5">{notice.created_at}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
