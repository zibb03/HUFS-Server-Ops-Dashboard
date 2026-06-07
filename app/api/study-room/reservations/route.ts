import { NextRequest, NextResponse } from 'next/server'
import { reserveIndividual, reserveGroup, getMyReservations } from '@/lib/study-room'
import { getCurrentUser } from '@/lib/session'
import type { StudyReserveResult } from '@/lib/types'

export const dynamic = 'force-dynamic'

const RESERVE_ERR: Record<string, string> = {
  full: '선택한 시간의 정원이 찼습니다.',
  duplicate: '이미 활성 예약이 있습니다. (1인 1예약)',
  not_found: '방을 찾을 수 없거나 유형이 맞지 않습니다.',
  penalty: '패널티 기간이라 예약할 수 없습니다.',
  invalid_participants: '예약 시간(1~2시간) 또는 인원이 올바르지 않습니다.',
  past: '이미 지난 시간입니다.',
  closed: '운영 시간이 아닙니다.',
}

// GET → 내 예약
export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json({ success: true, data: await getMyReservations(user.id) })
  } catch (err) {
    console.error('[/api/study-room/reservations] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

// POST → 예약 (개인/그룹). body.type = 'individual' | 'group'
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const b = await req.json() as {
      type?: 'individual' | 'group'
      room_number?: string; date?: string; start?: string; end?: string
      participants?: { name: string; email: string }[]
    }
    if (!b.room_number || !b.date || !b.start || !b.end) {
      return NextResponse.json({ success: false, error: '예약 정보를 모두 입력해주세요.' }, { status: 400 })
    }
    const base = {
      roomNumber: b.room_number, date: b.date, start: b.start, end: b.end,
      user: { id: user.id, email: user.email, name: user.name, student_id: user.student_id },
    }
    let result: StudyReserveResult
    if (b.type === 'group') {
      result = await reserveGroup(base, (b.participants ?? []).filter(p => p.name?.trim() && p.email?.trim()))
    } else {
      result = await reserveIndividual(base)
    }
    if (result !== 'ok') {
      return NextResponse.json({ success: false, error: RESERVE_ERR[result] ?? '예약 실패' }, { status: 400 })
    }
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[/api/study-room/reservations] POST error:', err)
    return NextResponse.json({ success: false, error: '예약 실패' }, { status: 500 })
  }
}
