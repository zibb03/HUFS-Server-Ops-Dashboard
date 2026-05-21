import { NextRequest, NextResponse } from 'next/server'
import { insertIPRequest, getIPRequests } from '@/lib/queries'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getIPRequests()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/requests/ip] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json() as { purpose?: string }
    const purpose = body.purpose?.trim()
    if (!purpose) {
      return NextResponse.json({ success: false, error: '신청 목적을 입력해주세요.' }, { status: 400 })
    }
    // 신원 필드는 클라가 보낸 값 무시, 서버 세션값으로 강제 주입
    const row = await insertIPRequest({
      applicant_name: user.name,
      department: user.department,
      student_id: user.student_id,
      purpose,
    })
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/requests/ip] POST error:', err)
    return NextResponse.json({ success: false, error: '신청 실패' }, { status: 500 })
  }
}
