import { NextRequest, NextResponse } from 'next/server'
import { setRoomActive } from '@/lib/study-room'
import { requireRole } from '@/lib/session'

// PATCH → 방 활성/비활성 토글 (관리자). body: { is_active: boolean }
export async function PATCH(req: NextRequest, { params }: { params: { number: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const b = await req.json() as { is_active?: boolean }
    const changed = await setRoomActive(params.number, b.is_active !== false)
    if (changed === 0) return NextResponse.json({ success: false, error: '해당 방 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/study-room/rooms/[number]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '처리 실패' }, { status: 500 })
  }
}
