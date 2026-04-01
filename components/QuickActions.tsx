import Link from 'next/link'

const ACTIONS = [
  {
    href:  '/requests/ip',
    label: 'IP 요청',
    desc:  '공인 IP 주소 신청',
    icon:  <LayersIcon />,
  },
  {
    href:  '/requests/equipment',
    label: '장비 대여',
    desc:  '학과 보유 기자재 대여',
    icon:  <MonitorIcon />,
  },
  {
    href:  '/requests/printer',
    label: '프린터 요청',
    desc:  '프린터 사용 신청',
    icon:  <PrinterIcon />,
  },
  {
    href:  '/requests/maintenance',
    label: '유지보수 신청',
    desc:  '기자재 수리 요청',
    icon:  <WrenchIcon />,
  },
]

export default function QuickActions() {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display font-bold text-base text-on-surface">작업 허브</h2>
        <span className="text-xs text-secondary uppercase tracking-widest">/ Quick Actions</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ACTIONS.map(({ href, label, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-surface-lowest rounded-md p-4 flex flex-col items-center gap-2.5 transition-all duration-200 hover:-translate-y-px"
            style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}
            >
              {icon}
            </div>
            <span className="text-sm font-display font-bold text-on-surface">{label}</span>
            <span className="text-xs text-secondary text-center">{desc}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function LayersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  )
}
function MonitorIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}
function PrinterIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  )
}
function WrenchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}
