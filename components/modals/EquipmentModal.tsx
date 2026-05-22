'use client'

import { useEffect, useState } from 'react'
import Modal, { FormField, Input, Select, ModalActions } from '../Modal'
import { useCurrentUser } from '@/lib/session-client'
import type { EquipmentItemRow } from '@/lib/types'

interface Props { open: boolean; onClose: () => void }

export default function EquipmentModal({ open, onClose }: Props) {
  const user = useCurrentUser()
  const [items, setItems] = useState<EquipmentItemRow[]>([])
  const [form, setForm] = useState({ equipment_type: '', rental_start: '', rental_end: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 모달 열릴 때 대여 가능(available_qty>0) 장비 카탈로그 조회
  useEffect(() => {
    if (!open) return
    setError('')
    fetch('/api/equipment-items?available=1')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setItems(j.data)
          setForm(p => ({ ...p, equipment_type: j.data[0]?.name ?? '' }))
        }
      })
      .catch(() => setError('장비 목록을 불러오지 못했습니다.'))
  }, [open])

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

  const noStock = items.length === 0

  return (
    <Modal title="장비 대여 신청" subtitle="Service Request" open={open} onClose={onClose}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="신청자명">
          <Input type="text" value={user.name} readOnly disabled />
        </FormField>
        <FormField label="대여 장비">
          {noStock ? (
            <p className="text-xs text-secondary py-2">현재 대여 가능한 장비가 없습니다.</p>
          ) : (
            <Select value={form.equipment_type} onChange={set('equipment_type')}>
              {items.map(it => (
                <option key={it.id} value={it.name}>
                  {it.name} — 대여 가능 {it.available_qty}대
                </option>
              ))}
            </Select>
          )}
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
        <ModalActions onClose={onClose} submitting={submitting || noStock} />
      </form>
    </Modal>
  )
}
