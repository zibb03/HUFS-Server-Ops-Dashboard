import GaugeCard from './GaugeCard'
import type { ServerStatusRow } from '@/lib/types'
import { useAdmin } from '@/lib/admin-context'

const DEFAULTS: ServerStatusRow = {
  id: 1, temperature: 22, humidity: 45, max_temp: 25, min_temp: 18,
  fire_detected: 0, overall_status: 'normal', uptime_percent: 99.97, updated_at: '',
}

interface Props { data?: ServerStatusRow }

export default function ServerStatus({ data = DEFAULTS }: Props) {
  const isAdmin    = useAdmin()
  const uptimeValue = Math.min(data.uptime_percent, 100)
  const tempValue   = Math.min((data.temperature / 40) * 100, 100)
  const humidValue  = Math.min(data.humidity, 100)

  if (isAdmin) {
    return (
      <section>
        <SectionHeader title="서버실 상태" sub="Server Room Status" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <GaugeCard
            title="현재 온도"
            value={tempValue}
            displayText={`${data.temperature}°`}
            displaySub="C"
            statusText="Optimal Range"
            statusVariant="success"
          >
            <div className="grid grid-cols-2 gap-1 text-center">
              <StatBox label="최고" value={`${data.max_temp}°C`} />
              <StatBox label="최저" value={`${data.min_temp}°C`} />
            </div>
          </GaugeCard>

          <GaugeCard
            title="현재 습도"
            value={humidValue}
            displayText={`${data.humidity}%`}
            displaySub="RH"
            statusText="Standard"
            statusVariant="success"
          >
            <StatBox label="권장 범위" value="40 ~ 60%" />
          </GaugeCard>

          <GaugeCard
            title="전체 상태"
            value={90}
            displayText=""
            statusText={data.overall_status === 'normal' ? '정상' : '주의'}
            statusVariant={data.overall_status === 'normal' ? 'success' : 'warning'}
            progressColor="#2d6a4f"
            centerIcon={<ShieldCheckIcon />}
          >
            <StatBox label="가동률" value={`${data.uptime_percent}%`} />
          </GaugeCard>

          <GaugeCard
            title="화재 감지"
            value={data.fire_detected ? 80 : 4}
            displayText=""
            statusText={data.fire_detected ? '감지됨!' : '감지 없음'}
            statusVariant={data.fire_detected ? 'error' : 'success'}
            progressColor={data.fire_detected ? '#ba1a1a' : '#2d6a4f'}
            centerIcon={<FlameIcon detected={!!data.fire_detected} />}
          >
            <StatBox label="스프링클러" value="대기 중" />
          </GaugeCard>

        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionHeader title="서버실 상태" sub="Server Room Status" />
      <div className="grid grid-cols-2 gap-4">

        <GaugeCard
          title="전체 상태"
          value={90}
          displayText=""
          statusText={data.overall_status === 'normal' ? '정상' : '주의'}
          statusVariant={data.overall_status === 'normal' ? 'success' : 'warning'}
          progressColor="#2d6a4f"
          centerIcon={<ShieldCheckIcon />}
        >
          <StatBox label="시스템" value={data.overall_status === 'normal' ? '정상 운영 중' : '점검 필요'} />
        </GaugeCard>

        <GaugeCard
          title="서버상황실 상태"
          value={uptimeValue}
          displayText={`${data.uptime_percent}%`}
          displaySub="가동률"
          statusText="운영 중"
          statusVariant="success"
          progressColor="#2d6a4f"
          centerIcon={<ServerIcon />}
        >
          <StatBox label="누적 가동률" value={`${data.uptime_percent}%`} />
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

function ShieldCheckIcon() {
  return (
    <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function FlameIcon({ detected }: { detected: boolean }) {
  return (
    <svg className={`w-7 h-7 ${detected ? 'text-error' : 'text-success'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  )
}

function ServerIcon() {
  return (
    <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/>
      <line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  )
}
