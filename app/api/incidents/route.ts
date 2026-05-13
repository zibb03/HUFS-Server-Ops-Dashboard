import { NextRequest, NextResponse } from 'next/server'
import { getIncidents, insertIncident } from '@/lib/queries'

export const dynamic = 'force-dynamic'

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
    const { title, status = 'processing' } = await req.json()
    if (!title) return NextResponse.json({ success: false, error: 'title 필수' }, { status: 400 })
    const row = await insertIncident(title, status)
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/incidents] POST error:', err)
    return NextResponse.json({ success: false, error: '등록 실패' }, { status: 500 })
  }
}
