'use client'

// 클라이언트 전용 세션 컨텍스트.
// 현재: 서버에서 prefetch한 SessionUser를 Provider로 내려보내고 useCurrentUser로 소비.
// ops-dashboard 이식 시: Provider 내부에서 Supabase auth 변경 구독을 추가하면 됨
// (시그니처 useCurrentUser 그대로 유지).
import { createContext, useContext } from 'react'
import type { SessionUser, UserRole } from './types'

const SessionContext = createContext<SessionUser | null>(null)

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser
  children: React.ReactNode
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}

export function useCurrentUser(): SessionUser {
  const u = useContext(SessionContext)
  if (!u) {
    throw new Error('useCurrentUser must be used inside <SessionProvider>')
  }
  return u
}

export function useHasRole(roles: UserRole[]): boolean {
  const u = useContext(SessionContext)
  return !!u && roles.includes(u.role)
}
