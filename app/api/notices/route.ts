import { NextRequest, NextResponse } from 'next/server'
import { getNotices, getPublicNotices, insertNotice } from '@/lib/queries'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 10)
    // scope=all: 비공개 포함 전체 (관리자 전용). 그 외: 공개 공지만.
    if (req.nextUrl.searchParams.get('scope') === 'all') {
      await requireRole(['admin', 'manager'])
      const data = await getNotices(limit)
      return NextResponse.json({ success: true, data })
    }
    const data = await getPublicNotices(limit)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/notices] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin', 'manager'])
    const { title, type = 'general', body, is_public } = await req.json() as {
      title?: string; type?: string; body?: string; is_public?: boolean
    }
    if (!title?.trim()) return NextResponse.json({ success: false, error: '제목을 입력해주세요.' }, { status: 400 })
    const row = await insertNotice({
      title: title.trim(),
      type,
      body: body?.trim() || null,
      is_public: is_public ?? true,
    })
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/notices] POST error:', err)
    return NextResponse.json({ success: false, error: '등록 실패' }, { status: 500 })
  }
}
