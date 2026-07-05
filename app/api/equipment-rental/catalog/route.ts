import { NextRequest, NextResponse } from 'next/server'
import { getCatalog } from '@/lib/equipment-rental'

export const dynamic = 'force-dynamic'

// GET ?start=&end= → 카탈로그 + 기간 가용 수량 (기간 없으면 총 수량)
export async function GET(req: NextRequest) {
  try {
    const start = req.nextUrl.searchParams.get('start') ?? undefined
    const end = req.nextUrl.searchParams.get('end') ?? undefined
    return NextResponse.json({ success: true, data: await getCatalog(start, end) })
  } catch (err) {
    console.error('[/api/equipment-rental/catalog] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}
