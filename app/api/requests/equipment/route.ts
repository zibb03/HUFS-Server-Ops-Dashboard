import { NextRequest, NextResponse } from 'next/server'
import { insertEquipmentRequest, getEquipmentRequests, getEquipmentItemByName } from '@/lib/queries'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getEquipmentRequests()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/requests/equipment] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json() as { equipment_type?: string; rental_start?: string; rental_end?: string }
    const { equipment_type, rental_start, rental_end } = body
    if (!equipment_type || !rental_start || !rental_end) {
      return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }
    // 카탈로그 재고 확인 — 대여 가능 수량이 0이면 신청 차단
    const item = await getEquipmentItemByName(equipment_type)
    if (!item) {
      return NextResponse.json({ success: false, error: '존재하지 않는 장비입니다.' }, { status: 400 })
    }
    if (item.available_qty <= 0) {
      return NextResponse.json({ success: false, error: '선택한 장비는 현재 대여 가능 수량이 없습니다.' }, { status: 400 })
    }
    const row = await insertEquipmentRequest({
      applicant_name: user.name,
      equipment_type,
      rental_start,
      rental_end,
    })
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/requests/equipment] POST error:', err)
    return NextResponse.json({ success: false, error: '신청 실패' }, { status: 500 })
  }
}
