import { NextRequest, NextResponse } from 'next/server'
import { cancelReservation, extendReservation } from '@/lib/study-room'
import { getCurrentUser } from '@/lib/session'

const CANCEL_ERR: Record<string, string> = {
  too_late: '시작 이후거나 입실 후라 취소할 수 없습니다.',
  not_found: '예약 내역 없음',
  forbidden: '본인 예약만 취소할 수 있습니다.',
}
const EXTEND_ERR: Record<string, string> = {
  no_slot: '운영 종료 시간이라 연장할 수 없습니다.',
  full: '다음 시간 정원이 찼습니다.',
  not_entered: '입실(ENTRANCE/LATE) 상태에서만 연장할 수 있습니다.',
  not_found: '예약 내역 없음',
}

// DELETE → 예약 취소 (1시간 이내면 패널티)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    const result = await cancelReservation(Number(params.id), user.id)
    if (result === 'ok') return NextResponse.json({ success: true })
    if (result === 'penalty') return NextResponse.json({ success: true, penalty: true, message: '취소되었으나 패널티가 부여되었습니다.' })
    return NextResponse.json({ success: false, error: CANCEL_ERR[result] ?? '취소 실패' }, { status: 400 })
  } catch (err) {
    console.error('[/api/study-room/reservations/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '취소 실패' }, { status: 500 })
  }
}

// PATCH → 예약 연장 (+1시간)
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    const result = await extendReservation(Number(params.id), user.id)
    if (result === 'ok') return NextResponse.json({ success: true })
    return NextResponse.json({ success: false, error: EXTEND_ERR[result] ?? '연장 실패' }, { status: 400 })
  } catch (err) {
    console.error('[/api/study-room/reservations/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '연장 실패' }, { status: 500 })
  }
}
