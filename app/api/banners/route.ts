import { NextRequest, NextResponse } from 'next/server'
import { getBanners, getActiveBanners, insertBanner } from '@/lib/queries'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const activeOnly = req.nextUrl.searchParams.get('active') === '1'
    const data = activeOnly ? await getActiveBanners() : await getBanners()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/banners] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin', 'manager'])
    const { text, sort_order, active } = await req.json() as { text?: string; sort_order?: number; active?: boolean }
    if (!text?.trim()) return NextResponse.json({ success: false, error: '내용을 입력해주세요.' }, { status: 400 })
    const row = await insertBanner({ text: text.trim(), sort_order, active })
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/banners] POST error:', err)
    return NextResponse.json({ success: false, error: '등록 실패' }, { status: 500 })
  }
}
