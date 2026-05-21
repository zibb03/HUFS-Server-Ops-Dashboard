import { NextRequest, NextResponse } from 'next/server'
import { updateNotice, deleteNotice } from '@/lib/queries'
import { requireRole } from '@/lib/session'

const VALID_TYPES = ['notice', 'info', 'general'] as const

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const body = await req.json() as { title?: string; type?: string; body?: string | null }
    const patch: { title?: string; type?: string; body?: string | null } = {}
    if (typeof body.title === 'string') {
      const t = body.title.trim()
      if (!t) return NextResponse.json({ success: false, error: '제목을 입력해주세요.' }, { status: 400 })
      patch.title = t
    }
    if (typeof body.type === 'string') {
      if (!VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])) {
        return NextResponse.json({ success: false, error: '유효하지 않은 유형' }, { status: 400 })
      }
      patch.type = body.type
    }
    if (body.body !== undefined) {
      const b = typeof body.body === 'string' ? body.body.trim() : null
      patch.body = b ? b : null
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: '수정 항목 없음' }, { status: 400 })
    }
    const id = Number(params.id)
    const changes = await updateNotice(id, patch)
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 공지 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/notices/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '수정 실패' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const id = Number(params.id)
    const changes = await deleteNotice(id)
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 공지 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/notices/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '삭제 실패' }, { status: 500 })
  }
}
