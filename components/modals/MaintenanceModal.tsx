'use client'

import { useState } from 'react'
import Modal, { FormField, Input, Select, Textarea, ModalActions } from '../Modal'
import { useCurrentUser } from '@/lib/session-client'

interface Props { open: boolean; onClose: () => void }

export default function MaintenanceModal({ open, onClose }: Props) {
  const user = useCurrentUser()
  const [form, setForm] = useState({ equipment_desc: '', issue_detail: '', urgency: 'normal' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests/maintenance', {
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
    <Modal title="유지보수 신청" subtitle="Service Request" open={open} onClose={onClose}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="신청자명">
          <Input type="text" value={user.name} readOnly disabled />
        </FormField>
        <FormField label="장비/시설 종류">
          <Input type="text" placeholder="서버 랙 #3, 노트북 등" value={form.equipment_desc} onChange={set('equipment_desc')} required />
        </FormField>
        <FormField label="장애 내용">
          <Textarea placeholder="발생한 장애 및 증상을 상세히 기재해 주세요." rows={3} value={form.issue_detail} onChange={set('issue_detail')} required />
        </FormField>
        <FormField label="긴급도">
          <Select value={form.urgency} onChange={set('urgency')}>
            <option value="normal">일반 (3~5 영업일)</option>
            <option value="urgent">긴급 (당일 처리 요청)</option>
          </Select>
        </FormField>
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} />
      </form>
    </Modal>
  )
}
