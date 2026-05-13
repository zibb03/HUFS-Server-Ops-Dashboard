import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getDashboardData()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/dashboard] GET error:', err)
    return NextResponse.json({ success: false, error: '데이터 조회 실패' }, { status: 500 })
  }
}
