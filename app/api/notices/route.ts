import { NextRequest, NextResponse } from 'next/server'
import { getNotices, insertNotice } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 10)
    const data = await getNotices(limit)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/notices] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, type = 'general' } = await req.json()
    if (!title) return NextResponse.json({ success: false, error: 'title 필수' }, { status: 400 })
    const row = await insertNotice(title, type)
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/notices] POST error:', err)
    return NextResponse.json({ success: false, error: '등록 실패' }, { status: 500 })
  }
}
