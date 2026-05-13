import { NextRequest, NextResponse } from 'next/server'
import { insertEquipmentRequest, getEquipmentRequests } from '@/lib/queries'
import type { EquipmentRequestPayload } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getEquipmentRequests()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/requests/equipment] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: EquipmentRequestPayload = await req.json()
    const { applicant_name, equipment_type, rental_start, rental_end } = body
    if (!applicant_name || !equipment_type || !rental_start || !rental_end) {
      return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }
    const row = await insertEquipmentRequest(body)
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/requests/equipment] POST error:', err)
    return NextResponse.json({ success: false, error: '신청 실패' }, { status: 500 })
  }
}
