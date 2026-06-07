import { NextRequest, NextResponse } from 'next/server'
import { deleteClass, getRegistersByClass } from '@/lib/coding-zone'
import { requireRole } from '@/lib/session'

// GET → 예약 명단 (관리자)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    return NextResponse.json({ success: true, data: await getRegistersByClass(Number(params.id)) })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/coding-zone/classes/[id]] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

// DELETE → 수업 삭제 (예약자 있으면 불가)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const result = await deleteClass(Number(params.id))
    if (result === 'has_register') return NextResponse.json({ success: false, error: '예약자가 있어 삭제할 수 없습니다.' }, { status: 400 })
    if (result === 'not_found') return NextResponse.json({ success: false, error: '해당 수업 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/coding-zone/classes/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '삭제 실패' }, { status: 500 })
  }
}
