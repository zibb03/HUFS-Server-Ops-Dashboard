import { NextRequest, NextResponse } from 'next/server'
import { updateNetworkDevice, deleteNetworkDevice } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import type { DeviceStatus } from '@/lib/types'

const VALID_STATUS = ['online', 'offline', 'warning'] as const

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const body = await req.json() as {
      hostname?: string; ip_address?: string; mac_address?: string; device_type?: string; status?: string
    }
    const patch: { hostname?: string; ip_address?: string; mac_address?: string; device_type?: string; status?: DeviceStatus } = {}
    if (typeof body.hostname === 'string') {
      if (!body.hostname.trim()) return NextResponse.json({ success: false, error: '호스트명을 입력해주세요.' }, { status: 400 })
      patch.hostname = body.hostname.trim()
    }
    if (typeof body.ip_address === 'string') {
      if (!body.ip_address.trim()) return NextResponse.json({ success: false, error: 'IP 주소를 입력해주세요.' }, { status: 400 })
      patch.ip_address = body.ip_address.trim()
    }
    if (typeof body.mac_address === 'string') {
      if (!body.mac_address.trim()) return NextResponse.json({ success: false, error: 'MAC 주소를 입력해주세요.' }, { status: 400 })
      patch.mac_address = body.mac_address.trim()
    }
    if (typeof body.device_type === 'string') {
      if (!body.device_type.trim()) return NextResponse.json({ success: false, error: '디바이스 유형을 입력해주세요.' }, { status: 400 })
      patch.device_type = body.device_type.trim()
    }
    if (typeof body.status === 'string') {
      if (!VALID_STATUS.includes(body.status as (typeof VALID_STATUS)[number])) {
        return NextResponse.json({ success: false, error: '유효하지 않은 상태값' }, { status: 400 })
      }
      patch.status = body.status as DeviceStatus
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: '수정 항목 없음' }, { status: 400 })
    }
    const id = Number(params.id)
    const changes = await updateNetworkDevice(id, patch)
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 장비 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/network/[id]] PATCH error:', err)
    return NextResponse.json({ success: false, error: '수정 실패' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin', 'manager'])
    const id = Number(params.id)
    const changes = await deleteNetworkDevice(id)
    if (changes === 0) return NextResponse.json({ success: false, error: '해당 장비 없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as { status?: number }).status === 403) {
      return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
    }
    console.error('[/api/network/[id]] DELETE error:', err)
    return NextResponse.json({ success: false, error: '삭제 실패' }, { status: 500 })
  }
}
