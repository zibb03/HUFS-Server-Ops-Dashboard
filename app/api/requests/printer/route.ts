import { NextRequest, NextResponse } from 'next/server'
import { insertPrinterRequest, getPrinterRequests } from '@/lib/queries'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const isAdmin = user.role === 'admin' || user.role === 'manager'
    const data = await getPrinterRequests(isAdmin ? {} : { userId: user.id })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/requests/printer] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json() as { printer_id?: string; copies?: number }
    const { printer_id, copies } = body
    if (!printer_id || !copies) {
      return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }
    const row = await insertPrinterRequest({
      applicant_name: user.name,
      printer_id,
      copies,
    }, user.id)
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/requests/printer] POST error:', err)
    return NextResponse.json({ success: false, error: '신청 실패' }, { status: 500 })
  }
}
