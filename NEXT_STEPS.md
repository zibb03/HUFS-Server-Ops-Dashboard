# 다음에 할 것들

> 작성: 2026-05-21
> 이 레포는 **시연용 prototyping 공간**. 최종은 `hufs-ice-server-ops-dashboard-supabase`로 이식.

---

## 0. 이식 호환성 5대 원칙

| 원칙 | Cursor_Practice | ops-dashboard 이식 시 |
|---|---|---|
| 세션은 `lib/session.ts`만 사용 | fake user (cookie/기본값) | `@supabase/ssr` + `auth.getUser()` + `profiles` 조인 |
| DB 접근은 `lib/queries.ts`만 통해서 | raw REST (`sbSelect/sbInsert/...`) | 함수 시그니처 유지, 내부만 Supabase SDK로 |
| 컴포넌트는 IO 금지 | 페이지/route handler에서만 fetch | 컴포넌트 무수정 복사 가능 |
| API 응답 포맷 고정 | `{ success, data?, error? }` | 동일 |
| 테이블명은 `lib/tables.ts` 상수 | `soc_*` prefix | 상수값만 prefix 없는 이름으로 교체 |

→ **이 원칙을 깨는 코드는 절대 추가하지 말 것.**

---

## 1. 적용 필요한 마이그레이션

- [ ] `supabase/migrations/2026_05_21_body_and_banners.sql` — Supabase SQL Editor에 적용
  - 공지 `body` 컬럼 추가
  - `soc_banners` 테이블 신규 (초기 데이터 5건 포함)

---

## 2. 미구현 기능 (우선순위 순)

### A. 신청 관리 보강
- [ ] **반려 사유 입력 모달** — 거절 시 모달로 사유 입력 → 신청 row에 `reject_reason` 저장
  - 필요: `soc_*_requests` 테이블 4종에 `reject_reason TEXT` 컬럼 추가
- [ ] **검색·상태필터·정렬·페이지네이션** — `app/requests/*/page.tsx` 4종 공통
  - 쿼리스트링 기반 URL (예: `?q=...&status=pending&page=2`)
  - `lib/queries.ts`에 `listRequests({type, status, q, page, sort})` 추가
- [ ] **내 신청 내역** — 일반 사용자는 본인 `user_id` 것만 조회
  - 필요: 신청 테이블에 `user_id BIGINT` 컬럼 추가
- [ ] **일괄 처리** — 다중 선택 후 일괄 승인/거절
- [ ] **CSV 내보내기** — 페이지별 헤더에 버튼 (클라이언트 Blob 생성)

### B. 장애(인시던트) 관리
- [ ] 장애 등록 모달 + `/api/incidents` POST
- [ ] 장애 수정/삭제 + 상태 전환(processing↔done) UI
- [ ] `IncidentModal.tsx` 신규
- [ ] `/api/incidents/[id]` PATCH/DELETE
- [ ] `lib/queries.ts`에 `updateIncident`, `deleteIncident`

### C. 네트워크 장비 관리
- [ ] 장비 등록/수정/삭제 모달 + `/api/network` CUD
- [ ] `NetworkDeviceModal.tsx`
- [ ] 상태(online/offline/warning) 수동 변경

### D. 감사 로그
- [ ] `soc_audit_log` 테이블 신규
- [ ] `lib/audit.ts: logAudit({actor, action, target, detail})`
- [ ] 모든 변경 API에서 호출
- [ ] `/admin/audit` 관리자 뷰

### E. 공통 UX
- [ ] 토스트 (`Toast.tsx`, `lib/toast.ts`)
- [ ] 에러 바운더리 (`app/error.tsx`)
- [ ] 로딩 스켈레톤 (`app/(...)/loading.tsx`)
- [ ] `zod`로 API 페이로드 검증

---

## 3. Cursor_Practice에서 **시연용 fake로만** 둘 것

이 부분은 ops-dashboard 이식 시 교체될 예정. 깊게 짓지 말 것.

| 항목 | 현재 (fake) | 이식 후 |
|---|---|---|
| 로그인 페이지 | "건너뛰기" 버튼 → `hufs_auth=1` 쿠키 | Google OAuth 콜백 |
| 세션 | `lib/session.ts`의 `DEMO_USER` 상수 (admin) | `auth.getUser()` + `profiles.role` |
| 이메일 알림 | (미구현) — 추가 시 `console.log` | Resend API |
| 모니터링 데이터 | seed (`server_status`, `security_status`, `server_load`) | ingest API + 실측 |

---

## 4. ops-dashboard로 이식할 때 체크리스트

1. `lib/tables.ts` — `soc_*` → prefix 없는 이름으로 교체
2. `lib/session.ts` — 내부를 `createServerClient` + `auth.getUser()` + `profiles` 조인으로 교체 (시그니처 유지)
3. `lib/session-client.tsx` — Supabase auth 상태 구독 추가 (`useCurrentUser` 시그니처 유지)
4. `lib/supabase.ts` — `@supabase/ssr` / `@supabase/supabase-js`로 교체 (sbSelect/sbInsert/... 시그니처 유지)
5. `middleware.ts` — `@supabase/ssr` 미들웨어로 교체 (cookie 기반 → real session)
6. 로그인/회원가입 페이지 → Google OAuth flow
7. `supabase/migrations/*.sql` → ops-dashboard `supabase/schema.sql`에 통합
8. RLS 정책 추가 (현재 service_role 키 우회 중)

---

## 5. 완료된 것

- [x] 호환 레이어 (`lib/tables.ts`, `lib/session.ts`, `lib/session-client.tsx`)
- [x] 신청 모달 4종 본인정보 자동채움 (readonly)
- [x] 신청 POST에서 user_id/신원 강제 주입
- [x] 신청 PATCH 4종 `requireRole(['admin', 'manager'])` 가드
- [x] 신청 액션 — 유지보수 취소/되돌리기, 거절·완료 confirm
- [x] 공지 작성/수정/삭제 + 본문(body) + 관리자 가드
- [x] `soc_banners` 테이블 + API + BannerModal + `/notices` 관리 섹션
- [x] Ticker 동적 fetch (폴백 텍스트 유지)
