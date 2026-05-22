import { NextRequest, NextResponse } from 'next/server'
import { getEquipmentItemById, updateEquipmentItem, deleteEquipmentItem } from '@/lib/queries'
import { requireRole } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const id = Number(params.id)
    const item = await getEquipmentItemById(id)
    if (!item) return NextResponse.json({ success: false, error: '해당 장비 없음' }, { status: 404 })

    const body = await req.json() as { name?: string; total_qty?: number }
    const patch: { name?: string; total_qty?: number; available_qty?: number } = {}

    if (typeof body.name === 'string') {
      if (!body.name.trim()) return NextResponse.json({ success: false, error: '장비명을 입력해주세요.' }, { status: 400 })
      patch.name = body.name.trim()
    }
    if (body.total_qty !== undefined) {
      const qty = Number(body.total_qty)
      if (!Number.isInteger(qty) || qty < 0) {
        return NextResponse.json({ success: false, error: '수량은 0 이상의 정수여야 합니다.' }, { status: 400 })
      }
      // 총 수량이 바뀌면 그 차이만큼 가용 수량도 조정 (0 ~ 새 총량 범위로 클램프)
      const delta = qty - item.total_qty
      patch.total_qty = qty
      patch.available_qty = Math.max(0, Math.min(qty, item.available_qty + delta))
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: '수정 항목 없음' }, { status: 400 })
    }

    await updateEquipmentItem(id, patch)
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/equipment-items/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '수정 실패' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const id = Number(params.id)
    const changes = await deleteEquipmentItem(id)
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 장비 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/equipment-items/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '삭제 실패' }, { status: 500 })
  }
}
