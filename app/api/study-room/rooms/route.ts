import { NextRequest, NextResponse } from 'next/server'
import { getRooms, createRoom } from '@/lib/study-room'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET → 방 목록 (비활성 방도 포함해서 반환 → 예약 화면에서 "예약 불가"로 표시).
// 방 목록 자체는 민감 정보가 아니므로 권한 게이트 없음.
export async function GET(_req: NextRequest) {
  try {
    return NextResponse.json({ success: true, data: await getRooms(true) })
  } catch (err) {
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
      min_participants?: number; location?: string; facilities?: string; open_time?: string; close_time?: string
    }
    if (!b.room_number?.trim() || !b.room_type || !b.capacity) {
      return NextResponse.json({ success: false, error: '방 번호/유형/정원을 입력해주세요.' }, { status: 400 })
    }
    await createRoom({
      room_number: b.room_number.trim(), room_type: b.room_type, capacity: Number(b.capacity),
      min_participants: b.min_participants ? Number(b.min_participants) : undefined,
      location: b.location, facilities: b.facilities?.trim() || undefined,
      open_time: b.open_time, close_time: b.close_time,
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
