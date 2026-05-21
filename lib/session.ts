// 서버 전용 세션 헬퍼.
// 현재(Cursor_Practice): 쿠키에서 demo_user JSON 읽기. 없으면 기본 fake 사용자 반환.
// ops-dashboard 이식 시: 내부 구현만 @supabase/ssr의 createServerClient + auth.getUser()
// + profiles 조인으로 교체하면 시그니처/리턴타입은 그대로 유지된다.
import { cookies } from 'next/headers'
import type { SessionUser, UserRole } from './types'

const DEMO_USER: SessionUser = {
  id: 1,
  email: 'demo@hufs.ac.kr',
  name: '데모 사용자',
  department: '정보통신공학과',
  student_id: '202400000',
  role: 'admin',
}

export async function getCurrentUser(): Promise<SessionUser> {
  try {
    const raw = cookies().get('demo_user')?.value
    if (!raw) return DEMO_USER
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<SessionUser>
    return { ...DEMO_USER, ...parsed }
  } catch {
    return DEMO_USER
  }
}

export async function getSessionUserId(): Promise<number> {
  const u = await getCurrentUser()
  return u.id
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const u = await getCurrentUser()
  if (!roles.includes(u.role)) {
    const err = new Error('FORBIDDEN') as Error & { status?: number }
    err.status = 403
    throw err
  }
  return u
}
