'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/lib/admin-context'
import EquipmentItemModal from '@/components/modals/EquipmentItemModal'
import type { EquipmentItemRow } from '@/lib/types'

export default function EquipmentItemsPage() {
  const isAdmin = useAdmin()
  const [items, setItems] = useState<EquipmentItemRow[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EquipmentItemRow | null>(null)

  const load = () =>
    fetch('/api/equipment-items').then(r => r.json()).then(j => { if (j.success) setItems(j.data) })

  useEffect(() => { load() }, [])

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    load()
  }

  const handleEdit = (it: EquipmentItemRow) => {
    setEditing(it)
    setOpen(true)
  }

  const handleDelete = async (it: EquipmentItemRow) => {
    if (!confirm(`"${it.name}" 장비를 카탈로그에서 삭제할까요?`)) return
    const res = await fetch(`/api/equipment-items/${it.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) { alert(json.error ?? '삭제 실패'); return }
    load()
  }

  const inUse = (it: EquipmentItemRow) => it.total_qty - it.available_qty

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-secondary mb-1">
            Equipment
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">장비 관리</h1>
          <p className="text-xs text-secondary mt-1">대여 신청 시 선택 가능한 장비와 수량을 관리합니다.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setOpen(true) }}
            className="px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #000d2f, #00205b)' }}
          >
            + 장비 등록
          </button>
        )}
      </div>

      <div className="bg-surface-lowest rounded-md overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,32,91,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low">
                {['장비명', '총 보유', '대여 가능', '대여 중', ...(isAdmin ? ['관리'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-display font-semibold text-secondary uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className={i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface'}>
                  <td className="px-4 py-3 font-medium text-on-surface">{it.name}</td>
                  <td className="px-4 py-3 text-on-surface">{it.total_qty}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${it.available_qty === 0 ? 'text-error' : 'text-success'}`}>
                      {it.available_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-secondary">{inUse(it)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(it)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-high text-on-surface hover:bg-surface-low transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(it)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-secondary text-sm">등록된 장비가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EquipmentItemModal open={open} onClose={handleClose} item={editing} />
    </>
  )
}
