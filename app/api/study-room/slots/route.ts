import { NextRequest, NextResponse } from 'next/server'
import { getSlots } from '@/lib/study-room'

export const dynamic = 'force-dynamic'

// GET ?room=305&date=2026-06-08 → 해당 방·날짜 슬롯 목록
export async function GET(req: NextRequest) {
  try {
    const room = req.nextUrl.searchParams.get('room')
    const date = req.nextUrl.searchParams.get('date')
    if (!room || !date) return NextResponse.json({ success: false, error: 'room/date 필요' }, { status: 400 })
    return NextResponse.json({ success: true, data: await getSlots(room, date) })
  } catch (err) {
    console.error('[/api/study-room/slots] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}
