import { NextRequest, NextResponse } from 'next/server'
import { getRooms, createRoom } from '@/lib/study-room'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET → 방 목록 (?all=1 이면 비활성 포함, 관리자)
export async function GET(req: NextRequest) {
  try {
    const includeInactive = req.nextUrl.searchParams.get('all') === '1'
    if (includeInactive) await requireRole(['admin', 'manager'])
    return NextResponse.json({ success: true, data: await getRooms(includeInactive) })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/study-room/rooms] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

// POST → 방 생성 (관리자)
export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin', 'manager'])
    const b = await req.json() as {
      room_number?: string; room_type?: 'GROUP' | 'INDIVIDUAL'; capacity?: number
      min_participants?: number; location?: string; open_time?: string; close_time?: string
    }
    if (!b.room_number?.trim() || !b.room_type || !b.capacity) {
      return NextResponse.json({ success: false, error: '방 번호/유형/정원을 입력해주세요.' }, { status: 400 })
    }
    await createRoom({
      room_number: b.room_number.trim(), room_type: b.room_type, capacity: Number(b.capacity),
      min_participants: b.min_participants ? Number(b.min_participants) : undefined,
      location: b.location, open_time: b.open_time, close_time: b.close_time,
    })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/study-room/rooms] POST error:', err)
    return NextResponse.json({ success: false, error: '생성 실패' }, { status: 500 })
  }
}
