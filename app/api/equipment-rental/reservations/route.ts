import { NextRequest, NextResponse } from 'next/server'
import { reserve, getMyRentals } from '@/lib/equipment-rental'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const ERR: Record<string, string> = {
  not_found: '해당 기자재를 찾을 수 없습니다.',
  invalid_date: '대여 기간이 올바르지 않습니다. (과거 불가, 시작≤종료)',
  invalid_qty: '수량이 올바르지 않습니다.',
  no_stock: '해당 기간에 남은 수량이 부족합니다.',
  overdue_block: '연체 중인 대여가 있어 예약할 수 없습니다. 먼저 반납하세요.',
}

// GET → 내 대여
export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json({ success: true, data: await getMyRentals(user.id) })
  } catch (err) {
    console.error('[/api/equipment-rental/reservations] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

// POST → 대여 예약
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const b = await req.json() as { item_id?: number; qty?: number; start?: string; end?: string }
    if (!b.item_id || !b.start || !b.end) {
      return NextResponse.json({ success: false, error: '기자재·대여 기간을 입력해주세요.' }, { status: 400 })
    }
    const result = await reserve(Number(b.item_id), Number(b.qty ?? 1), b.start, b.end, {
      id: user.id, email: user.email, name: user.name, student_id: user.student_id,
    })
    if (result !== 'ok') return NextResponse.json({ success: false, error: ERR[result] ?? '예약 실패' }, { status: 400 })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[/api/equipment-rental/reservations] POST error:', err)
    return NextResponse.json({ success: false, error: '예약 실패' }, { status: 500 })
  }
}
