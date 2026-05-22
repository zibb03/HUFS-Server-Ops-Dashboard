'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/lib/admin-context'
import NoticeModal from '@/components/modals/NoticeModal'
import BannerModal from '@/components/modals/BannerModal'
import type { NoticeRow, BannerRow } from '@/lib/types'

const TYPE_CFG = {
  notice:  { label: '공지', className: 'bg-primary/10 text-primary' },
  info:    { label: '안내', className: 'bg-amber-100 text-amber-700' },
  general: { label: '일반', className: 'bg-surface-high text-secondary' },
}

export default function NoticesPage() {
  const isAdmin = useAdmin()
  const [notices, setNotices] = useState<NoticeRow[]>([])
  const [banners, setBanners] = useState<BannerRow[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<NoticeRow | null>(null)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null)

  // 관리자는 비공개 포함 전체(scope=all), 일반 사용자는 공개 공지만
  const load = () => {
    const url = isAdmin ? '/api/notices?scope=all&limit=100' : '/api/notices?limit=100'
    fetch(url).then(r => r.json()).then(j => { if (j.success) setNotices(j.data) })
  }

  const loadBanners = () =>
    fetch('/api/banners').then(r => r.json()).then(j => { if (j.success) setBanners(j.data) })

  useEffect(() => { load(); loadBanners() }, [isAdmin])

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    load()
  }

  const handleEdit = (n: NoticeRow) => {
    setEditing(n)
    setOpen(true)
  }

  const handleDelete = async (n: NoticeRow) => {
    if (!confirm(`"${n.title}" 공지를 삭제할까요?`)) return
    const res = await fetch(`/api/notices/${n.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) { alert(json.error ?? '삭제 실패'); return }
    load()
  }

  const handleBannerClose = () => {
    setBannerOpen(false)
    setEditingBanner(null)
    loadBanners()
  }

  const handleBannerEdit = (b: BannerRow) => {
    setEditingBanner(b)
    setBannerOpen(true)
  }

  const handleBannerDelete = async (b: BannerRow) => {
    if (!confirm(`"${b.text.slice(0, 20)}..." 배너를 삭제할까요?`)) return
    const res = await fetch(`/api/banners/${b.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) { alert(json.error ?? '삭제 실패'); return }
    loadBanners()
  }

  const handleBannerToggle = async (b: BannerRow) => {
    const res = await fetch(`/api/banners/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !b.active }),
    })
    const json = await res.json()
    if (!json.success) { alert(json.error ?? '변경 실패'); return }
    loadBanners()
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">
            Announcements
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">공지사항</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setOpen(true) }}
            className="px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}
          >
            + 공지 등록
          </button>
        )}
      </div>

      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        {notices.length === 0 && (
          <div className="px-5 py-12 text-center text-secondary text-sm">공지사항이 없습니다.</div>
        )}
        {notices.map((n, i) => {
          const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.general
          return (
            <div
              key={n.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-surface transition-colors"
              style={{ borderBottom: i < notices.length - 1 ? '1px solid #f2f4f6' : 'none' }}
            >
              <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${cfg.className}`}>
                {cfg.label}
              </span>
              {/* 제목 클릭 시 게시판 상세로 이동 */}
              <Link href={`/notices/${n.id}`} className="flex-1 min-w-0 group">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-on-surface group-hover:text-primary group-hover:underline truncate">
                    {n.title}
                  </span>
                  {!n.is_public && (
                    <span className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded bg-surface-high text-secondary">
                      비공개
                    </span>
                  )}
                </div>
                <div className="text-xs text-secondary mt-0.5">{n.created_at}</div>
              </Link>
              {isAdmin && (
                <div className="flex-shrink-0 flex gap-1.5">
                  <button
                    onClick={() => handleEdit(n)}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(n)}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <NoticeModal open={open} onClose={handleClose} notice={editing} />

      {/* ── 관리자 전용: 상단 배너 관리 ── */}
      {isAdmin && (
        <>
          <div className="mt-10 mb-4 flex items-end justify-between">
            <div>
              <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">
                Top Banner
              </div>
              <h2 className="font-display font-extrabold text-xl text-on-surface">상단 배너 관리</h2>
              <p className="text-xs text-secondary mt-1">화면 상단 스크롤 배너에 노출되는 문구입니다. 활성 항목만 노출됩니다.</p>
            </div>
            <button
              onClick={() => { setEditingBanner(null); setBannerOpen(true) }}
              className="px-4 py-2 rounded text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}
            >
              + 배너 등록
            </button>
          </div>

          <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
            {banners.length === 0 && (
              <div className="px-5 py-12 text-center text-secondary text-sm">등록된 배너가 없습니다.</div>
            )}
            {banners.map((b, i) => (
              <div
                key={b.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-surface transition-colors"
                style={{ borderBottom: i < banners.length - 1 ? '1px solid #f2f4f6' : 'none' }}
              >
                <span className="flex-shrink-0 text-xs text-secondary font-semibold w-8 text-center">{b.sort_order}</span>
                <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${b.active ? 'bg-green-50 text-green-700' : 'bg-surface-high text-secondary'}`}>
                  {b.active ? '활성' : '비활성'}
                </span>
                <div className="flex-1 min-w-0 text-sm text-on-surface truncate">{b.text}</div>
                <div className="flex-shrink-0 flex gap-1.5">
                  <button
                    onClick={() => handleBannerToggle(b)}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low transition-colors"
                  >
                    {b.active ? '숨기기' : '노출'}
                  </button>
                  <button
                    onClick={() => handleBannerEdit(b)}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleBannerDelete(b)}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          <BannerModal open={bannerOpen} onClose={handleBannerClose} banner={editingBanner} />
        </>
      )}
    </>
  )
}
