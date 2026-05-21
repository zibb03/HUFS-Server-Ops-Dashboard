'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Ticker from './Ticker'
import Sidebar from './Sidebar'
import { AdminContext } from '@/lib/admin-context'
import { SessionProvider } from '@/lib/session-client'
import type { SessionUser } from '@/lib/types'

export default function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [open, setOpen]       = useState(false)
  const [isAdmin, setIsAdmin] = useState(user.role === 'admin')
  const pathname = usePathname()

  // 페이지 이동 시 사이드바 닫기
  useEffect(() => { setOpen(false) }, [pathname])

  // 사이드바 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // 로그인 페이지는 쉘 없이 렌더링
  if (pathname === '/login') return <SessionProvider user={user}>{children}</SessionProvider>

  return (
    <SessionProvider user={user}>
    <AdminContext.Provider value={isAdmin}>
      <Ticker
        onMenuClick={() => setOpen(true)}
        isAdmin={isAdmin}
        onAdminToggle={() => setIsAdmin(v => !v)}
      />

      {/* 모바일: calc(100vh - 48px), 데스크톱: calc(100vh - 36px) */}
      <div className="flex overflow-hidden h-[calc(100vh-48px)] md:h-[calc(100vh-36px)]">

        {/* 데스크톱 사이드바 */}
        <div className="hidden md:block flex-shrink-0 h-full">
          <Sidebar isAdmin={isAdmin} />
        </div>

        {/* 모바일 오버레이 */}
        {open && (
          <div
            className="fixed z-40 bg-black/50 md:hidden left-0 right-0 bottom-0 top-12"
            onClick={() => setOpen(false)}
          />
        )}

        {/* 모바일 사이드바 패널 */}
        <div
          className={[
            'fixed z-50 md:hidden top-12',
            'transition-transform duration-300 ease-in-out',
            open ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
          style={{ left: 0, height: 'calc(100vh - 48px)', width: 220 }}
        >
          <Sidebar isAdmin={isAdmin} onClose={() => setOpen(false)} />
        </div>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-surface-low px-3 py-4 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </AdminContext.Provider>
    </SessionProvider>
  )
}
