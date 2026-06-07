import { NextResponse } from 'next/server'
import { getSubjects } from '@/lib/coding-zone'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await getSubjects() })
  } catch (err) {
    console.error('[/api/coding-zone/subjects] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}
