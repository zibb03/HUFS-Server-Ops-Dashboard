import { NextResponse } from 'next/server'
import { getAllReservations } from '@/lib/study-room'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET → 전체 예약 (관리자)
export async function GET() {
  try {
    await requireRole(['admin', 'manager'])
    return NextResponse.json({ success: true, data: await getAllReservations() })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/study-room/admin/reservations] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}
