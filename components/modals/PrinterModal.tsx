'use client'

import { useState } from 'react'
import Modal, { FormField, Input, Select, ModalActions } from '../Modal'
import { useCurrentUser } from '@/lib/session-client'

interface Props { open: boolean; onClose: () => void }

export default function PrinterModal({ open, onClose }: Props) {
  const user = useCurrentUser()
  const [form, setForm] = useState({ printer_id: '프린터 #1 (1층 로비)', copies: '1' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests/printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, copies: Number(form.copies) }),
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
    <Modal title="프린터 사용 신청" subtitle="Service Request" open={open} onClose={onClose}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="신청자명">
          <Input type="text" value={user.name} readOnly disabled />
        </FormField>
        <FormField label="프린터 선택">
          <Select value={form.printer_id} onChange={set('printer_id')}>
            <option>프린터 #1 (1층 로비)</option>
            <option>프린터 #2 (2층 열람실)</option>
            <option>프린터 #3 (3층 행정실)</option>
          </Select>
        </FormField>
        <FormField label="출력 매수">
          <Input type="number" min={1} value={form.copies} onChange={set('copies')} required />
        </FormField>
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} />
      </form>
    </Modal>
  )
}
