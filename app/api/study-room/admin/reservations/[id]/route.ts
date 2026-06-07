import { NextRequest, NextResponse } from 'next/server'
import { adminForceCancel } from '@/lib/study-room'
import { requireRole } from '@/lib/session'

// DELETE → 예약 강제 취소 (관리자)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const result = await adminForceCancel(Number(params.id))
    if (result === 'not_found') return NextResponse.json({ success: false, error: '예약 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/study-room/admin/reservations/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '취소 실패' }, { status: 500 })
  }
}
