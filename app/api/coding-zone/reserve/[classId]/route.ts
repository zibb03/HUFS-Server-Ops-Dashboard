import { NextRequest, NextResponse } from 'next/server'
import { reserveClass, cancelClass, isReservationOpen } from '@/lib/coding-zone'
import { getCurrentUser } from '@/lib/session'

export async function POST(_req: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!isReservationOpen()) {
      return NextResponse.json({ success: false, error: '예약 가능 시간이 아닙니다. (목 16:00 ~ 일 24:00)' }, { status: 400 })
    }
    const result = await reserveClass(Number(params.classId), {
      id: user.id, email: user.email, name: user.name, student_id: user.student_id,
    })
    if (result === 'duplicate') return NextResponse.json({ success: false, error: '이미 예약한 수업입니다.' }, { status: 400 })
    if (result === 'full')      return NextResponse.json({ success: false, error: '정원이 마감되었습니다.' }, { status: 400 })
    if (result === 'not_found') return NextResponse.json({ success: false, error: '해당 수업 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/coding-zone/reserve] POST error:', err)
    return NextResponse.json({ success: false, error: '예약 실패' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!isReservationOpen()) {
      return NextResponse.json({ success: false, error: '예약 변경 가능 시간이 아닙니다.' }, { status: 400 })
    }
    const result = await cancelClass(Number(params.classId), user.id)
    if (result === 'not_found') return NextResponse.json({ success: false, error: '예약 내역 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/coding-zone/reserve] DELETE error:', err)
    return NextResponse.json({ success: false, error: '취소 실패' }, { status: 500 })
  }
}
