import GaugeCard from './GaugeCard'
import type { SecurityStatusRow } from '@/lib/types'

const DEFAULTS: SecurityStatusRow = {
  id: 1, threat_level: 10, national_threat_level: 10, updated_at: '',
}

interface Props { data?: SecurityStatusRow }

export default function SecurityStatus({ data = DEFAULTS }: Props) {
  const threatValue    = Math.min(data.threat_level, 100)
  const natThreatValue = Math.min(data.national_threat_level, 100)
  const threatLow      = data.threat_level < 40
  const natThreatLow   = data.national_threat_level < 40

  return (
    <section>
      <SectionHeader title="보안 위협 현황" sub="Security Status" />
      <div className="grid grid-cols-2 gap-4">

        <GaugeCard
          title="보안 위협 상태"
          value={threatValue}
          displayText=""
          statusText={threatLow ? '위협 없음' : '위협 감지'}
          statusVariant={threatLow ? 'success' : 'error'}
          progressColor={threatLow ? '#2d6a4f' : '#ba1a1a'}
          centerIcon={<LockIcon safe={threatLow} />}
        >
          <StatBox label="위협 수준" value={`${data.threat_level}%`} />
        </GaugeCard>

        <GaugeCard
          title="국가보안 위협"
          value={natThreatValue}
          displayText=""
          statusText={natThreatLow ? '위협 없음' : '위협 감지'}
          statusVariant={natThreatLow ? 'success' : 'error'}
          progressColor={natThreatLow ? '#2d6a4f' : '#ba1a1a'}
          centerIcon={<ShieldIcon safe={natThreatLow} />}
        >
          <StatBox label="위협 수준" value={`${data.national_threat_level}%`} />
        </GaugeCard>

      </div>
    </section>
  )
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="font-display font-bold text-base text-on-surface">{title}</h2>
      <span className="text-xs text-secondary uppercase tracking-widest">/ {sub}</span>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-low rounded p-1.5 text-center">
      <div className="text-xs text-secondary">{label}</div>
      <div className="text-sm font-display font-bold text-on-surface">{value}</div>
    </div>
  )
}

function LockIcon({ safe }: { safe: boolean }) {
  return (
    <svg className={`w-7 h-7 ${safe ? 'text-success' : 'text-error'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function ShieldIcon({ safe }: { safe: boolean }) {
  return (
    <svg className={`w-7 h-7 ${safe ? 'text-success' : 'text-error'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
