import { NextResponse } from 'next/server'
import { getNetworkDevices } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getNetworkDevices()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/network] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}
