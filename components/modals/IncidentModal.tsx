'use client'

import { useEffect, useState } from 'react'
import Modal, { FormField, Input, Select, Textarea, ModalActions } from '../Modal'
import type { IncidentRow } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  incident?: IncidentRow | null  // 있으면 수정 모드, 없으면 신규
}

export default function IncidentModal({ open, onClose, incident }: Props) {
  const isEdit = !!incident
  const [form, setForm] = useState({ title: '', body: '', status: 'processing' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(incident
        ? { title: incident.title, body: incident.body ?? '', status: incident.status }
        : { title: '', body: '', status: 'processing' })
      setError('')
    }
  }, [open, incident])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const url = isEdit ? `/api/incidents/${incident!.id}` : '/api/incidents'
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
      title={isEdit ? '장애 수정' : '장애 등록'}
      subtitle="Incident"
      open={open}
      onClose={onClose}
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="장애 내용">
          <Input
            type="text"
            placeholder="예) 학과 네트워크 지연"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="상세 (선택)">
          <Textarea
            placeholder="장애 상세 내용을 입력해주세요. (생략 가능)"
            rows={5}
            value={form.body}
            onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
          />
        </FormField>
        <FormField label="상태">
          <Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="processing">처리중</option>
            <option value="done">완료</option>
          </Select>
        </FormField>
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} submitLabel={isEdit ? '수정' : '등록'} />
      </form>
    </Modal>
  )
}
