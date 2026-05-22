'use client'

import { useEffect, useState } from 'react'
import Modal, { FormField, Input, Select, Textarea, ModalActions } from '../Modal'
import type { NoticeRow } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  notice?: NoticeRow | null  // 있으면 수정 모드, 없으면 신규
}

export default function NoticeModal({ open, onClose, notice }: Props) {
  const isEdit = !!notice
  const [form, setForm] = useState({ title: '', type: 'general', body: '', is_public: true })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(notice
        ? { title: notice.title, type: notice.type, body: notice.body ?? '', is_public: notice.is_public }
        : { title: '', type: 'general', body: '', is_public: true })
      setError('')
    }
  }, [open, notice])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const url = isEdit ? `/api/notices/${notice!.id}` : '/api/notices'
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
      title={isEdit ? '공지 수정' : '공지 등록'}
      subtitle="Announcement"
      open={open}
      onClose={onClose}
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="제목">
          <Input
            type="text"
            placeholder="공지 제목을 입력해주세요."
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="유형">
          <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            <option value="notice">공지</option>
            <option value="info">안내</option>
            <option value="general">일반</option>
          </Select>
        </FormField>
        <FormField label="내용 (선택)">
          <Textarea
            placeholder="공지 본문을 입력해주세요. (생략 가능)"
            rows={5}
            value={form.body}
            onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
          />
        </FormField>
        <FormField label="공개 여부">
          <label className="flex items-center gap-2 h-9 px-3 bg-surface-low rounded text-sm text-on-surface cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))}
            />
            <span>{form.is_public ? '공개 — 모든 사용자에게 노출' : '비공개 — 관리자만 조회'}</span>
          </label>
        </FormField>
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} submitLabel={isEdit ? '수정' : '등록'} />
      </form>
    </Modal>
  )
}
