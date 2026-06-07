import { NextRequest, NextResponse } from 'next/server'
import { getClassesWithMine, getAllClasses, insertClass } from '@/lib/coding-zone'
import { getCurrentUser, requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET ?subject=1  → 다음주 수업(내 예약 표시) / ?scope=all → 전체(관리자)
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('scope') === 'all') {
      await requireRole(['admin', 'manager'])
      return NextResponse.json({ success: true, data: await getAllClasses() })
    }
    const user = await getCurrentUser()
    const subjectId = Number(req.nextUrl.searchParams.get('subject') ?? 1)
    return NextResponse.json({ success: true, data: await getClassesWithMine(subjectId, user.id) })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/coding-zone/classes] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

// POST → 수업 개설 (관리자)
export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin', 'manager'])
    const body = await req.json() as {
      subject_id?: number; class_name?: string; assistant_name?: string
      class_date?: string; class_time?: string; week_day?: string; maximum_number?: number
    }
    if (!body.subject_id || !body.class_name?.trim() || !body.assistant_name?.trim()
        || !body.class_date || !body.class_time?.trim() || !body.maximum_number) {
      return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }
    await insertClass({
      subject_id: Number(body.subject_id),
      class_name: body.class_name.trim(),
      assistant_name: body.assistant_name.trim(),
      class_date: body.class_date,
      class_time: body.class_time.trim(),
      week_day: body.week_day,
      maximum_number: Number(body.maximum_number),
    })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/coding-zone/classes] POST error:', err)
    return NextResponse.json({ success: false, error: '개설 실패' }, { status: 500 })
  }
}
