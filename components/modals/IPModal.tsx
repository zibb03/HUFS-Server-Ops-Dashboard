'use client'

import { useState } from 'react'
import Modal, { FormField, Input, Textarea, ModalActions } from '../Modal'
import { useCurrentUser } from '@/lib/session-client'

interface Props { open: boolean; onClose: () => void }

export default function IPModal({ open, onClose }: Props) {
  const user = useCurrentUser()
  const [purpose, setPurpose] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests/ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error ?? '신청 실패'); return }
      setPurpose('')
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="IP 주소 신청" subtitle="Service Request" open={open} onClose={onClose}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="신청자명">
          <Input type="text" value={user.name} readOnly disabled />
        </FormField>
        <FormField label="소속 학과/부서">
          <Input type="text" value={user.department} readOnly disabled />
        </FormField>
        <FormField label="학번/사번">
          <Input type="text" value={user.student_id} readOnly disabled />
        </FormField>
        <FormField label="신청 목적">
          <Textarea placeholder="IP 신청 목적을 상세히 기재해 주세요." rows={3} value={purpose} onChange={e => setPurpose(e.target.value)} required />
        </FormField>
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} />
      </form>
    </Modal>
  )
}
