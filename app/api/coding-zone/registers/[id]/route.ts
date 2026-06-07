import { NextRequest, NextResponse } from 'next/server'
import { toggleAttendance } from '@/lib/coding-zone'
import { requireRole } from '@/lib/session'

// PATCH → 출석 토글 (관리자). body 없음.
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const changes = await toggleAttendance(Number(params.id))
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 예약 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/coding-zone/registers/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '처리 실패' }, { status: 500 })
  }
}
