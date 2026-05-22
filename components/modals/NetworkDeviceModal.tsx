'use client'

import { useEffect, useState } from 'react'
import Modal, { FormField, Input, Select, ModalActions } from '../Modal'
import type { NetworkDeviceRow } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  device?: NetworkDeviceRow | null  // 있으면 수정 모드, 없으면 신규
}

export default function NetworkDeviceModal({ open, onClose, device }: Props) {
  const isEdit = !!device
  const [form, setForm] = useState({
    hostname: '', ip_address: '', mac_address: '', device_type: '', status: 'online',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(device
        ? {
            hostname: device.hostname,
            ip_address: device.ip_address,
            mac_address: device.mac_address,
            device_type: device.device_type,
            status: device.status,
          }
        : { hostname: '', ip_address: '', mac_address: '', device_type: '', status: 'online' })
      setError('')
    }
  }, [open, device])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const url = isEdit ? `/api/network/${device!.id}` : '/api/network'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error ?? '처리 실패'); return }
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEdit ? '장비 수정' : '장비 등록'}
      subtitle="Network Device"
      open={open}
      onClose={onClose}
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="호스트명">
          <Input type="text" placeholder="web-server-01" value={form.hostname} onChange={set('hostname')} required />
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="IP 주소">
            <Input type="text" placeholder="10.0.1.10" value={form.ip_address} onChange={set('ip_address')} required />
          </FormField>
          <FormField label="MAC 주소">
            <Input type="text" placeholder="AA:BB:CC:DD:EE:01" value={form.mac_address} onChange={set('mac_address')} required />
          </FormField>
        </div>
        <FormField label="디바이스 유형">
          <Input type="text" placeholder="웹 서버, DB 서버 등" value={form.device_type} onChange={set('device_type')} required />
        </FormField>
        <FormField label="상태">
          <Select value={form.status} onChange={set('status')}>
            <option value="online">온라인</option>
            <option value="warning">주의</option>
            <option value="offline">오프라인</option>
          </Select>
        </FormField>
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} submitLabel={isEdit ? '수정' : '등록'} />
      </form>
    </Modal>
  )
}
