type ServerStatus = 'online' | 'warning' | 'offline'

interface ServerNode {
  id: string
  label: string
  ip: string
  cpu: number
  mem: number
  status: ServerStatus
  group: string
  count?: number
}

const SERVERS: ServerNode[] = [
  { id: 'ops',       group: '상황실 서버',    label: '상황실 서버',      ip: '203.251.x.x',  cpu: 18, mem: 34, status: 'online' },
  { id: 'dl1',       group: '딥러닝 서버',    label: '딥러닝 서버 1',    ip: '203.251.x.1',  cpu: 72, mem: 61, status: 'online' },
  { id: 'dl2',       group: '딥러닝 서버',    label: '딥러닝 서버 2',    ip: '203.251.x.2',  cpu: 85, mem: 78, status: 'warning' },
  { id: 'dl3',       group: '딥러닝 서버',    label: '딥러닝 서버 3',    ip: '203.251.x.3',  cpu: 43, mem: 52, status: 'online' },
  { id: 'dl4',       group: '딥러닝 서버',    label: '딥러닝 서버 4',    ip: '203.251.x.4',  cpu: 91, mem: 88, status: 'warning' },
  { id: 'dl5',       group: '딥러닝 서버',    label: '딥러닝 서버 5',    ip: '203.251.x.5',  cpu: 12, mem: 29, status: 'online' },
  { id: 'dl6',       group: '딥러닝 서버',    label: '딥러닝 서버 6',    ip: '203.251.x.6',  cpu: 0,  mem: 0,  status: 'offline' },
  { id: 'ice',       group: 'ICECOMPUTE',     label: 'ICECOMPUTE',       ip: '203.251.x.x',  cpu: 54, mem: 67, status: 'online', count: 6 },
]

const STATUS_META: Record<ServerStatus, { label: string; dot: string; badge: string }> = {
  online:  { label: '정상',   dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700' },
  warning: { label: '주의',   dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700' },
  offline: { label: '오프라인', dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700' },
}

const GROUPS = ['상황실 서버', '딥러닝 서버', 'ICECOMPUTE']

export default function ServerMonitor() {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display font-bold text-base text-on-surface">서버 모니터링</h2>
        <span className="text-xs text-secondary uppercase tracking-widest">/ Server Monitor</span>
        <span className="ml-auto text-xs text-secondary">실시간</span>
      </div>

      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        {/* Header */}
        <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_6rem] gap-4 px-4 py-2.5 text-xs font-display font-semibold uppercase tracking-widest text-secondary bg-surface-low">
          <span>서버</span>
          <span className="text-center">IP</span>
          <span className="text-center">CPU</span>
          <span className="text-center">MEM</span>
          <span className="text-center">상태</span>
        </div>

        {GROUPS.map((group, gi) => {
          const nodes = SERVERS.filter(s => s.group === group)
          return (
            <div key={group}>
              <div className="px-4 py-1.5 text-xs font-display font-semibold text-secondary/60 uppercase tracking-widest"
                style={{ background: 'rgba(0,13,47,0.02)' }}>
                {group}
              </div>
              {nodes.map((srv, i) => {
                const meta = STATUS_META[srv.status]
                const isLast = i === nodes.length - 1 && gi === GROUPS.length - 1
                return (
                  <div
                    key={srv.id}
                    className="grid grid-cols-2 md:grid-cols-[2fr_1.2fr_1fr_1fr_6rem] gap-x-4 gap-y-1 items-center px-4 py-3"
                    style={{ borderTop: '1px solid rgba(0,13,47,0.05)' }}
                  >
                    {/* 서버명 */}
                    <div className="flex items-center gap-2 col-span-2 md:col-span-1 md:col-start-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                      <span className="text-sm font-display font-semibold text-on-surface">{srv.label}</span>
                      {srv.count && (
                        <span className="text-xs text-secondary">({srv.count}노드)</span>
                      )}
                    </div>

                    {/* IP */}
                    <div className="text-xs text-secondary font-mono hidden md:block md:col-start-2 text-center">{srv.ip}</div>

                    {/* CPU */}
                    <div className="hidden md:block md:col-start-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-high rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: srv.status !== 'offline' ? `${srv.cpu}%` : '0%',
                              background: srv.cpu >= 85 ? '#d97706' : '#000d2f',
                              transition: 'width 1.2s ease-in-out',
                            }}
                          />
                        </div>
                        <span className="text-xs font-display font-bold text-on-surface w-8 text-center">
                          {srv.status !== 'offline' ? `${srv.cpu}%` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* MEM */}
                    <div className="hidden md:block md:col-start-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-high rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: srv.status !== 'offline' ? `${srv.mem}%` : '0%',
                              background: srv.mem >= 85 ? '#d97706' : '#00205b',
                              transition: 'width 1.2s ease-in-out',
                            }}
                          />
                        </div>
                        <span className="text-xs font-display font-bold text-on-surface w-8 text-center">
                          {srv.status !== 'offline' ? `${srv.mem}%` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* 상태 배지 */}
                    <div className="flex items-center justify-end md:justify-center col-span-1 md:col-start-5 md:col-span-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* 모바일: CPU/MEM 간략 표시 */}
                    <div className="col-span-2 flex gap-3 md:hidden">
                      <span className="text-xs text-secondary">CPU <b className="text-on-surface">{srv.status !== 'offline' ? `${srv.cpu}%` : '—'}</b></span>
                      <span className="text-xs text-secondary">MEM <b className="text-on-surface">{srv.status !== 'offline' ? `${srv.mem}%` : '—'}</b></span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}
