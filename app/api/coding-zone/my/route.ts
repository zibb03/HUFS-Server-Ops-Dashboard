import { NextResponse } from 'next/server'
import { getMyReservations } from '@/lib/coding-zone'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET → 내 예약/출결 현황
export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json({ success: true, data: await getMyReservations(user.id) })
  } catch (err) {
    console.error('[/api/coding-zone/my] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}
