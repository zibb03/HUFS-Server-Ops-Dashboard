import type { ServerLoadRow } from '@/lib/types'

const DEFAULTS: ServerLoadRow = {
  id: 1, web_server: 30, db_server: 55, network: 20, storage: 72, updated_at: '',
}

interface Props { data?: ServerLoadRow }

export default function ServerLoad({ data = DEFAULTS }: Props) {
  const servers = [
    { label: '웹 서버',  value: data.web_server, color: '#000d2f' },
    { label: 'DB 서버',  value: data.db_server,  color: '#00205b' },
    { label: '네트워크', value: data.network,     color: '#4a5568' },
    { label: '스토리지', value: data.storage,     color: '#d97706' },
  ]

  return (
    <section className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display font-bold text-base text-on-surface">서버 부하 현황</h2>
        <span className="text-xs text-secondary uppercase tracking-widest">/ Infrastructure</span>
      </div>

      <div
        className="flex-1 bg-surface-lowest rounded-md p-5 flex flex-col justify-center transition-all duration-200 hover:-translate-y-px"
        style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}
      >
        <div className="space-y-4">
          {servers.map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-sm text-on-surface">{label}</span>
                </div>
                <span className="text-sm font-display font-bold text-on-surface">{value}%</span>
              </div>
              <div className="w-full bg-surface-high rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${value}%`, background: color, transition: 'width 1.2s ease-in-out' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
