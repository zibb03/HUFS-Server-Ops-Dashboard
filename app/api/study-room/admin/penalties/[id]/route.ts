import { NextRequest, NextResponse } from 'next/server'
import { expirePenalty } from '@/lib/study-room'
import { requireRole } from '@/lib/session'

// PATCH → 패널티 해제(만료 처리) (관리자)
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const changed = await expirePenalty(Number(params.id))
    if (changed === 0) return NextResponse.json({ success: false, error: '패널티 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/study-room/admin/penalties/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '처리 실패' }, { status: 500 })
  }
}
