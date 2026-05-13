import { NextRequest, NextResponse } from 'next/server'
import { updateEquipmentRequestStatus } from '@/lib/queries'
import type { RequestStatus } from '@/lib/types'

const VALID: RequestStatus[] = ['pending', 'approved', 'rejected', 'completed']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json() as { status: RequestStatus }
    if (!VALID.includes(status)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 상태값' }, { status: 400 })
    }
    const id = Number(params.id)
    const changes = await updateEquipmentRequestStatus(id, status)
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 항목 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/requests/equipment/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '처리 실패' }, { status: 500 })
  }
}
