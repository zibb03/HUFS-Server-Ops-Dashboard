import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNoticeById } from '@/lib/queries'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const TYPE_CFG = {
  notice:  { label: '공지', className: 'bg-primary/10 text-primary' },
  info:    { label: '안내', className: 'bg-amber-100 text-amber-700' },
  general: { label: '일반', className: 'bg-surface-high text-secondary' },
}

export default async function NoticeDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const notice = Number.isFinite(id) ? await getNoticeById(id) : null
  if (!notice) notFound()

  // 비공개 공지는 관리자(admin/manager)만 열람 가능
  if (!notice.is_public) {
    const user = await getCurrentUser()
    if (user.role !== 'admin' && user.role !== 'manager') {
      return (
        <div className="max-w-2xl mx-auto">
          <Link href="/notices" className="text-xs text-primary hover:underline">← 공지사항 목록</Link>
          <div
            className="mt-4 bg-surface-lowest rounded-md px-6 py-16 text-center"
            style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}
          >
            <div className="text-2xl mb-2">🔒</div>
            <h1 className="font-display font-bold text-lg text-on-surface">비공개 공지입니다</h1>
            <p className="text-sm text-secondary mt-1">관리자 권한이 있는 사용자만 열람할 수 있습니다.</p>
          </div>
        </div>
      )
    }
  }

  const cfg = TYPE_CFG[notice.type] ?? TYPE_CFG.general

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/notices" className="text-xs text-primary hover:underline">← 공지사항 목록</Link>

      <article
        className="mt-4 bg-surface-lowest rounded-md overflow-hidden"
        style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}
      >
        {/* 헤더 */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #f2f4f6' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cfg.className}`}>{cfg.label}</span>
            {!notice.is_public && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-surface-high text-secondary">
                비공개
              </span>
            )}
          </div>
          <h1 className="font-display font-extrabold text-xl text-on-surface">{notice.title}</h1>
          <div className="text-xs text-secondary mt-2">{notice.created_at}</div>
        </div>

        {/* 본문 */}
        <div className="px-6 py-6">
          {notice.body ? (
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{notice.body}</p>
          ) : (
            <p className="text-sm text-secondary">상세 내용이 없습니다.</p>
          )}
        </div>
      </article>
    </div>
  )
}
