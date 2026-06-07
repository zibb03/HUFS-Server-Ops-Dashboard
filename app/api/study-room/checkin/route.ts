import { NextRequest, NextResponse } from 'next/server'
import { checkIn } from '@/lib/study-room'

const MSG: Record<string, string> = {
  ENTRANCE: '정상 입실 처리되었습니다.',
  LATE: '지각 입실 처리되었습니다. (패널티 부여)',
  NO_SHOW: '노쇼 처리되었습니다. (패널티 부여)',
  too_early: '아직 입실 시간 전입니다.',
  not_found: '유효하지 않은 QR/토큰입니다.',
  already: '이미 처리된 예약입니다.',
}

// POST → QR 입실. body: { qrToken }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json() as { qrToken?: string }
    if (!b.qrToken?.trim()) return NextResponse.json({ success: false, error: '토큰이 필요합니다.' }, { status: 400 })
    const { result, name } = await checkIn(b.qrToken.trim())
    const ok = result === 'ENTRANCE' || result === 'LATE'
    return NextResponse.json({
      success: ok, status: result, name, message: MSG[result] ?? result,
    }, { status: ok ? 200 : 400 })
  } catch (err) {
    console.error('[/api/study-room/checkin] POST error:', err)
    return NextResponse.json({ success: false, error: '입실 처리 실패' }, { status: 500 })
  }
}
