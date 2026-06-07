'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_NORMAL = [
  {
    group: '메뉴',
    items: [
      { href: '/',        label: '대시보드', icon: <GridIcon /> },
    ],
  },
  {
    group: '서비스',
    items: [
      { href: '/requests/ip',          label: 'IP 요청',      icon: <LayersIcon /> },
      { href: '/requests/equipment',   label: '장비 대여',    icon: <MonitorIcon /> },
      { href: '/requests/printer',     label: '프린터 요청',  icon: <PrinterIcon /> },
      { href: '/requests/maintenance', label: '유지보수 신청', icon: <WrenchIcon /> },
    ],
  },
  {
    group: '코딩존',
    items: [
      { href: '/coding-zone',            label: '예약',    icon: <CodeIcon /> },
      { href: '/coding-zone/attendance', label: '내 출석', icon: <CheckIcon /> },
    ],
  },
  {
    group: '관리',
    items: [
      { href: '/notices', label: '공지사항', icon: <BellIcon /> },
    ],
  },
]

const NAV_ADMIN = [
  {
    group: '메뉴',
    items: [
      { href: '/',        label: '대시보드', icon: <GridIcon /> },
      { href: '/network', label: '네트워크', icon: <NetworkIcon /> },
    ],
  },
  {
    group: '서비스',
    items: [
      { href: '/requests/ip',          label: 'IP 요청',      icon: <LayersIcon /> },
      { href: '/requests/equipment',   label: '장비 대여',    icon: <MonitorIcon /> },
      { href: '/requests/printer',     label: '프린터 요청',  icon: <PrinterIcon /> },
      { href: '/requests/maintenance', label: '유지보수 신청', icon: <WrenchIcon /> },
    ],
  },
  {
    group: '코딩존',
    items: [
      { href: '/coding-zone',            label: '예약',        icon: <CodeIcon /> },
      { href: '/coding-zone/attendance', label: '내 출석',     icon: <CheckIcon /> },
      { href: '/coding-zone/manage',     label: '코딩존 관리', icon: <CalendarIcon /> },
    ],
  },
  {
    group: '관리',
    items: [
      { href: '/notices',   label: '공지사항',  icon: <BellIcon /> },
      { href: '/equipment', label: '장비 관리', icon: <BoxIcon /> },
      { href: '/logs',      label: '로그',      icon: <FileTextIcon /> },
    ],
  },
]

interface Props {
  onClose?: () => void
  isAdmin?: boolean
}

export default function Sidebar({ onClose, isAdmin = false }: Props) {
  const pathname = usePathname()
  const NAV = isAdmin ? NAV_ADMIN : NAV_NORMAL

  return (
    <aside
      className="h-full flex flex-col overflow-y-auto scrollbar-thin"
      style={{ width: 220, background: 'linear-gradient(180deg, #000d2f 0%, #00205b 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-start justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
        <Link href="/" onClick={onClose}>
          <div className="text-white font-display font-extrabold text-sm leading-tight">한국외국어대학교</div>
          <div className="text-white/60 text-xs mt-0.5">서버종합상황실</div>
        </Link>
        {/* 모바일 닫기 버튼 */}
        {onClose && (
          <button
            className="md:hidden text-white/50 hover:text-white mt-0.5"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* 시스템 상태 */}
      <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
          <span className="text-green-400 text-xs">시스템 정상</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <div className="text-white/35 text-xs font-display font-semibold uppercase tracking-widest px-2 pb-1.5">
              {group}
            </div>
            <div className="space-y-0.5">
              {items.map(({ href, label, icon }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
                    style={{
                      borderLeft: active ? '3px solid #fff' : '3px solid transparent',
                      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    }}
                  >
                    <span className={active ? 'text-white/90' : 'text-white/50'}>{icon}</span>
                    <span className={`text-sm ${active ? 'text-white/90 font-medium' : 'text-white/50'}`}>
                      {label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 모드 표시 */}
      <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className={`text-xs font-semibold ${isAdmin ? 'text-amber-400' : 'text-white/30'}`}>
          {isAdmin ? '🔓 관리자 모드' : '🔒 일반 모드'}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="text-white/30 text-xs">HUFS ARES-SOC</div>
        <div className="text-white/20 text-xs mt-0.5">© 2024 한국외국어대학교</div>
      </div>
    </aside>
  )
}

function GridIcon()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function NetworkIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/></svg> }
function LayersIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> }
function MonitorIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> }
function PrinterIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> }
function WrenchIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> }
function BellIcon()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> }
function FileTextIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function BoxIcon()      { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function CodeIcon()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> }
function CheckIcon()    { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> }
function CalendarIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
