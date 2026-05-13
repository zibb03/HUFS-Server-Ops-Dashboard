import { NextRequest, NextResponse } from 'next/server'
import { insertMaintenanceRequest, getMaintenanceRequests } from '@/lib/queries'
import type { MaintenanceRequestPayload } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getMaintenanceRequests()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/requests/maintenance] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: MaintenanceRequestPayload = await req.json()
    const { applicant_name, equipment_desc, issue_detail } = body
    if (!applicant_name || !equipment_desc || !issue_detail) {
      return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }
    const row = await insertMaintenanceRequest({ ...body, urgency: body.urgency ?? 'normal' })
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/requests/maintenance] POST error:', err)
    return NextResponse.json({ success: false, error: '신청 실패' }, { status: 500 })
  }
}
