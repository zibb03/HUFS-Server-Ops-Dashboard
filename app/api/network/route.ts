import { NextRequest, NextResponse } from 'next/server'
import { getNetworkDevices, insertNetworkDevice } from '@/lib/queries'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

const VALID_STATUS = ['online', 'offline', 'warning'] as const

export async function GET() {
  try {
    const data = await getNetworkDevices()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/network] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin', 'manager'])
    const { hostname, ip_address, mac_address, device_type, status = 'online' } = await req.json() as {
      hostname?: string; ip_address?: string; mac_address?: string; device_type?: string; status?: string
    }
    if (!hostname?.trim() || !ip_address?.trim() || !mac_address?.trim() || !device_type?.trim()) {
      return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }
    if (!VALID_STATUS.includes(status as (typeof VALID_STATUS)[number])) {
      return NextResponse.json({ success: false, error: '유효하지 않은 상태값' }, { status: 400 })
    }
    const row = await insertNetworkDevice({
      hostname: hostname.trim(),
      ip_address: ip_address.trim(),
      mac_address: mac_address.trim(),
      device_type: device_type.trim(),
      status: status as (typeof VALID_STATUS)[number],
    })
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/network] POST error:', err)
    return NextResponse.json({ success: false, error: '등록 실패' }, { status: 500 })
  }
}
