import { NextRequest, NextResponse } from 'next/server'
import { getEquipmentItems, getAvailableEquipmentItems, insertEquipmentItem } from '@/lib/queries'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // available=1: 대여 가능(available_qty>0) 장비만 — 신청 모달 드롭다운용
    const availableOnly = req.nextUrl.searchParams.get('available') === '1'
    const data = availableOnly ? await getAvailableEquipmentItems() : await getEquipmentItems()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/equipment-items] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin', 'manager'])
    const { name, total_qty } = await req.json() as { name?: string; total_qty?: number }
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: '장비명을 입력해주세요.' }, { status: 400 })
    }
    const qty = Number(total_qty)
    if (!Number.isInteger(qty) || qty < 0) {
      return NextResponse.json({ success: false, error: '수량은 0 이상의 정수여야 합니다.' }, { status: 400 })
    }
    const row = await insertEquipmentItem({ name: name.trim(), total_qty: qty })
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/equipment-items] POST error:', err)
    return NextResponse.json({ success: false, error: '등록 실패 (중복된 장비명일 수 있습니다)' }, { status: 500 })
  }
}
