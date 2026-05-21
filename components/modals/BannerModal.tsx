'use client'

import { useEffect, useState } from 'react'
import Modal, { FormField, Input, Textarea, ModalActions } from '../Modal'
import type { BannerRow } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  banner?: BannerRow | null
}

export default function BannerModal({ open, onClose, banner }: Props) {
  const isEdit = !!banner
  const [form, setForm] = useState({ text: '', sort_order: '0', active: true })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(banner
        ? { text: banner.text, sort_order: String(banner.sort_order), active: banner.active }
        : { text: '', sort_order: '0', active: true })
      setError('')
    }
  }, [open, banner])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const url = isEdit ? `/api/banners/${banner!.id}` : '/api/banners'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: form.text,
          sort_order: Number(form.sort_order),
          active: form.active,
        }),
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
      title={isEdit ? '배너 수정' : '배너 등록'}
      subtitle="Top Banner"
      open={open}
      onClose={onClose}
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <FormField label="배너 내용">
          <Textarea
            placeholder="예) 📢 5월 22일 전체 서버 통합 업그레이드 시작"
            rows={3}
            value={form.text}
            onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="정렬 순서 (낮을수록 앞)">
            <Input
              type="number"
              value={form.sort_order}
              onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="활성">
            <label className="flex items-center gap-2 h-9 px-3 bg-surface-low rounded text-sm text-on-surface cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
              />
              <span>{form.active ? '활성 (노출)' : '비활성 (숨김)'}</span>
            </label>
          </FormField>
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        <ModalActions onClose={onClose} submitting={submitting} submitLabel={isEdit ? '수정' : '등록'} />
      </form>
    </Modal>
  )
}
