import { NextRequest, NextResponse } from 'next/server'
import { cancel, pickup, returnItem } from '@/lib/equipment-rental'
import { getCurrentUser } from '@/lib/session'

// DELETE → 예약 취소 (수령 전만)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    const r = await cancel(Number(params.id), user.id)
    if (r === 'ok') return NextResponse.json({ success: true })
    const msg = r === 'too_late' ? '수령 후에는 취소할 수 없습니다. (반납으로 처리)'
      : r === 'forbidden' ? '본인 대여만 취소할 수 있습니다.' : '대여 내역 없음'
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  } catch (err) {
    console.error('[/api/equipment-rental/reservations/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '취소 실패' }, { status: 500 })
  }
}

// PATCH → 수령(pickup) / 반납(return). body: { action }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    const { action } = await req.json() as { action?: 'pickup' | 'return' }
    const fn = action === 'return' ? returnItem : pickup
    const r = await fn(Number(params.id), user.id)
    if (r === 'ok') return NextResponse.json({ success: true })
    const msg = r === 'forbidden' ? '본인 대여만 처리할 수 있습니다.'
      : r === 'invalid' ? '처리할 수 없는 상태입니다.' : '대여 내역 없음'
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  } catch (err) {
    console.error('[/api/equipment-rental/reservations/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '처리 실패' }, { status: 500 })
  }
}
