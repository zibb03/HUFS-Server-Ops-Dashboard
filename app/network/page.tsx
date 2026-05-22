'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/lib/admin-context'
import NetworkDeviceModal from '@/components/modals/NetworkDeviceModal'
import type { NetworkDeviceRow } from '@/lib/types'

const STATUS_CFG = {
  online:  { dot: 'bg-success', badge: 'bg-success-container text-success',     label: '온라인' },
  offline: { dot: 'bg-error',   badge: 'bg-error-container text-error',         label: '오프라인' },
  warning: { dot: 'bg-amber-500 pulse-dot', badge: 'bg-amber-100 text-amber-700', label: '주의' },
}

const STATS = [
  { label: '총 디바이스',   key: 'total',   color: '#000d2f' },
  { label: '온라인',        key: 'online',  color: '#2d6a4f' },
  { label: '오프라인',      key: 'offline', color: '#ba1a1a' },
  { label: '주의',          key: 'warning', color: '#d97706' },
]

export default function NetworkPage() {
  const isAdmin = useAdmin()
  const [devices, setDevices] = useState<NetworkDeviceRow[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<NetworkDeviceRow | null>(null)

  const load = () =>
    fetch('/api/network').then(r => r.json()).then(j => { if (j.success) setDevices(j.data) })

  useEffect(() => { load() }, [])

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    load()
  }

  const handleEdit = (d: NetworkDeviceRow) => {
    setEditing(d)
    setOpen(true)
  }

  const handleDelete = async (d: NetworkDeviceRow) => {
    if (!confirm(`"${d.hostname}" 장비를 삭제할까요?`)) return
    const res = await fetch(`/api/network/${d.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) { alert(json.error ?? '삭제 실패'); return }
    load()
  }

  const counts = {
    total:   devices.length,
    online:  devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    warning: devices.filter(d => d.status === 'warning').length,
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <PageHeader title="네트워크" sub="Network Status" />
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setOpen(true) }}
            className="px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}
          >
            + 장비 등록
          </button>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STATS.map(({ label, key, color }) => (
          <div key={key} className="bg-surface-lowest rounded-md p-4" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
            <div className="text-xs text-secondary mb-1">{label}</div>
            <div className="font-display font-extrabold text-2xl" style={{ color }}>
              {counts[key as keyof typeof counts]}
            </div>
          </div>
        ))}
      </div>

      {/* 디바이스 테이블 */}
      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #f2f4f6' }}>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-0.5">Devices</div>
          <h2 className="font-display font-bold text-base text-on-surface">네트워크 디바이스 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low">
                {['호스트명', 'IP 주소', 'MAC 주소', '디바이스 유형', '마지막 확인', '상태', ...(isAdmin ? ['관리'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map((d, i) => {
                const cfg = STATUS_CFG[d.status] ?? STATUS_CFG.online
                return (
                  <tr key={d.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                    <td className="px-4 py-3 font-medium text-on-surface">{d.hostname}</td>
                    <td className="px-4 py-3 font-mono text-xs text-on-surface">{d.ip_address}</td>
                    <td className="px-4 py-3 font-mono text-xs text-secondary">{d.mac_address}</td>
                    <td className="px-4 py-3 text-secondary">{d.device_type}</td>
                    <td className="px-4 py-3 text-xs text-secondary">{d.last_seen}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEdit(d)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(d)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {devices.length === 0 && (
                <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-secondary text-sm">데이터 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NetworkDeviceModal open={open} onClose={handleClose} device={editing} />
    </>
  )
}

function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">
        Server Operations Center
      </div>
      <h1 className="font-display font-extrabold text-2xl text-on-surface">{title}</h1>
      <div className="text-xs text-secondary mt-1">{sub}</div>
    </div>
  )
}
