import { NextResponse } from 'next/server'
import { getMyPenalties } from '@/lib/study-room'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET → 내 패널티
export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json({ success: true, data: await getMyPenalties(user.id) })
  } catch (err) {
    console.error('[/api/study-room/penalties] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}
