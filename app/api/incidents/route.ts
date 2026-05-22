import { NextRequest, NextResponse } from 'next/server'
import { getIncidents, insertIncident } from '@/lib/queries'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

const VALID_STATUS = ['processing', 'done'] as const

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 10)
    const data = await getIncidents(limit)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/incidents] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin', 'manager'])
    const { title, status = 'processing', body } = await req.json() as { title?: string; status?: string; body?: string }
    if (!title?.trim()) return NextResponse.json({ success: false, error: '제목을 입력해주세요.' }, { status: 400 })
    if (!VALID_STATUS.includes(status as (typeof VALID_STATUS)[number])) {
      return NextResponse.json({ success: false, error: '유효하지 않은 상태값' }, { status: 400 })
    }
    const row = await insertIncident({ title: title.trim(), status, body: body?.trim() || null })
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/incidents] POST error:', err)
    return NextResponse.json({ success: false, error: '등록 실패' }, { status: 500 })
  }
}
