'use client'

import { useState } from 'react'
import Modal, { FormField, Input, Select, ModalActions } from '../Modal'
import { useCurrentUser } from '@/lib/session-client'

interface Props { open: boolean; onClose: () => void }

export default function EquipmentModal({ open, onClose }: Props) {
  const user = useCurrentUser()
  const [form, setForm] = useState({ equipment_type: '노트북 (Dell XPS 13)', rental_start: '', rental_end: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error ?? '신청 실패'); return }
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="장비 대여 신청" subtitle="Service Request" open={open} onClose={onClose}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="신청자명">
          <Input type="text" value={user.name} readOnly disabled />
        </FormField>
        <FormField label="대여 장비">
          <Select value={form.equipment_type} onChange={set('equipment_type')}>
            <option>노트북 (Dell XPS 13)</option>
            <option>태블릿 (iPad Pro)</option>
            <option>카메라 (Canon EOS R)</option>
            <option>빔프로젝터</option>
            <option>기타</option>
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="대여 시작일">
            <Input type="date" value={form.rental_start} onChange={set('rental_start')} required />
          </FormField>
          <FormField label="반납 예정일">
            <Input type="date" value={form.rental_end} onChange={set('rental_end')} required />
          </FormField>
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} />
      </form>
    </Modal>
  )
}
