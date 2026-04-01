'use client'

import { useState, useEffect } from 'react'
import ServerStatus from './ServerStatus'
import SecurityStatus from './SecurityStatus'
import ServerLoad from './ServerLoad'
import ServerMonitor from './ServerMonitor'
import QuickActions from './QuickActions'
import IncidentList from './IncidentList'
import NoticeList from './NoticeList'
import { useAdmin } from '@/lib/admin-context'
import type { DashboardData } from '@/lib/types'

export default function Dashboard() {
  const isAdmin = useAdmin()
  const [currentTime, setCurrentTime] = useState('')
  const [dashData, setDashData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const update = () =>
      setCurrentTime(new Date().toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(json => { if (json.success) setDashData(json.data) })
      .catch(err => console.error('Dashboard fetch error:', err))
  }, [])

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">
          Server Operations Center
        </div>
        <h1 className="font-display font-extrabold text-2xl text-on-surface">통합 대시보드</h1>
        <div className="text-xs text-secondary mt-1">마지막 업데이트: {currentTime}</div>
      </div>

      {isAdmin ? (
        /* ── 관리자 레이아웃 ── */
        <>
          <div className="mb-5">
            <ServerStatus data={dashData?.serverStatus} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <SecurityStatus data={dashData?.securityStatus} />
            <ServerLoad data={dashData?.serverLoad} />
          </div>
          <ServerMonitor />
        </>
      ) : (
        /* ── 일반 사용자 레이아웃 ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <ServerStatus data={dashData?.serverStatus} />
          <SecurityStatus data={dashData?.securityStatus} />
        </div>
      )}

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IncidentList data={dashData?.incidents} />
        <NoticeList   data={dashData?.notices} />
      </div>

      <div className="mt-6 pt-4 flex items-center justify-between text-xs text-secondary"
        style={{ borderTop: '1px solid #e6e8ea' }}>
        <span>2024 한국외국어대학교 서버종합상황실</span>
        <span>HUFS Server Ops · 개인정보보호방침 · 이용약관</span>
      </div>
    </>
  )
}
