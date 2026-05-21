import { NextRequest, NextResponse } from 'next/server'
import { updateBanner, deleteBanner } from '@/lib/queries'
import { requireRole } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const body = await req.json() as { text?: string; sort_order?: number; active?: boolean }
    const patch: { text?: string; sort_order?: number; active?: boolean } = {}
    if (typeof body.text === 'string') {
      const t = body.text.trim()
      if (!t) return NextResponse.json({ success: false, error: '내용을 입력해주세요.' }, { status: 400 })
      patch.text = t
    }
    if (typeof body.sort_order === 'number') patch.sort_order = body.sort_order
    if (typeof body.active === 'boolean') patch.active = body.active
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: '수정 항목 없음' }, { status: 400 })
    }
    const id = Number(params.id)
    const changes = await updateBanner(id, patch)
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 배너 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/banners/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '수정 실패' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const id = Number(params.id)
    const changes = await deleteBanner(id)
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 배너 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/banners/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '삭제 실패' }, { status: 500 })
  }
}
