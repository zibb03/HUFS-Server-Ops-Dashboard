import { NextRequest, NextResponse } from 'next/server'
import { adminForceReturn } from '@/lib/equipment-rental'
import { requireRole } from '@/lib/session'

// DELETE → 강제 반납/취소 (관리자)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const r = await adminForceReturn(Number(params.id))
    if (r === 'not_found') return NextResponse.json({ success: false, error: '대여 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/equipment-rental/admin/reservations/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '처리 실패' }, { status: 500 })
  }
}
