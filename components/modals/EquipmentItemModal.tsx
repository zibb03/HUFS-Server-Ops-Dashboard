'use client'

import { useEffect, useState } from 'react'
import Modal, { FormField, Input, ModalActions } from '../Modal'
import type { EquipmentItemRow } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  item?: EquipmentItemRow | null  // 있으면 수정 모드, 없으면 신규
}

export default function EquipmentItemModal({ open, onClose, item }: Props) {
  const isEdit = !!item
  const [form, setForm] = useState({ name: '', total_qty: '1' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(item
        ? { name: item.name, total_qty: String(item.total_qty) }
        : { name: '', total_qty: '1' })
      setError('')
    }
  }, [open, item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const url = isEdit ? `/api/equipment-items/${item!.id}` : '/api/equipment-items'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, total_qty: Number(form.total_qty) }),
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
      subtitle="Equipment Item"
      open={open}
      onClose={onClose}
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="장비명">
          <Input
            type="text"
            placeholder="예) 노트북 (Dell XPS 13)"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="총 보유 수량">
          <Input
            type="number"
            min={0}
            value={form.total_qty}
            onChange={e => setForm(p => ({ ...p, total_qty: e.target.value }))}
            required
          />
        </FormField>
        {isEdit && (
          <p className="text-xs text-secondary">
            총 수량을 바꾸면 대여 가능 수량도 그 차이만큼 자동 조정됩니다.
          </p>
        )}
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} submitLabel={isEdit ? '수정' : '등록'} />
      </form>
    </Modal>
  )
}
