# 서버종합상황실 — 구현 로드맵

> 작성: 2026-05-18 · 대상: hufs-server-ops (Next.js 14 App Router + Supabase REST)
> 현 상태: UI/디자인·데이터 연동 완료. 인증·권한·콘텐츠 관리가 미구현(껍데기).

## 설계 전제 (Architecture Decisions)

- **AD-1 인증 방식**: 커스텀 JWT + 자체 `soc_users` 테이블.
  - 이유: 본 프로젝트는 `supabase-js` 미사용(raw REST) 원칙. Supabase Auth 도입 시 구조 변경 큼.
  - 대안(기각): Supabase GoTrue REST 직접 호출 — 도메인 제한·세션관리 복잡, 일관성 저하.
- **AD-2 비밀번호 해시**: `bcryptjs`(순수 JS). 해시·검증은 Node 런타임 route에서만. 미들웨어(Edge)에서는 JWT 검증만.
- **AD-3 세션**: stateless JWT(`jose`), httpOnly·Secure·SameSite=Lax 쿠키. 세션 테이블 없음(로그아웃은 만료 단축 + 클라 삭제, 필요 시 차후 deny-list).
- **AD-4 가입 정책**: 이메일 도메인 화이트리스트(`@hufs.ac.kr` 등) + 가입 후 `status='pending'` → 관리자 승인 시 `active`. 환경변수로 도메인 목록 제어.
- **AD-5 권한 모델**: `role ∈ {student, staff, admin}`. 변경 API는 서버측 role 가드 필수. 클라 가드는 UX용일 뿐 신뢰 안 함.

---

## Phase 0 — 데이터 모델 (선행, 무중단 마이그레이션)

`supabase/schema.sql`에 추가 + `scripts/apply-soc-schema.js`로 적용. 기존 컬럼은 nullable 추가 → 백필 → 제약 강화 순.

- `soc_users`: `id BIGSERIAL PK`, `email TEXT UNIQUE NOT NULL`, `password_hash TEXT NOT NULL`, `name TEXT`, `student_id TEXT`, `department TEXT`, `role TEXT NOT NULL DEFAULT 'student'`, `status TEXT NOT NULL DEFAULT 'pending'`, `created_at`
- `soc_audit_log`: `id`, `actor_id BIGINT`, `action TEXT`, `target_table TEXT`, `target_id BIGINT`, `detail JSONB`, `created_at`
- 요청 4종(`soc_ip/equipment/printer/maintenance_requests`)에 `user_id BIGINT REFERENCES soc_users(id)` 추가(nullable)
- `soc_notices`: `body TEXT`, `pinned BOOLEAN DEFAULT false`, `author_id BIGINT`, `published_from TEXT`, `published_until TEXT`
- `soc_incidents`: `body TEXT`, `author_id BIGINT`
- 인덱스: `soc_users(email)`, 요청테이블 `(user_id)`, `soc_notices(pinned, created_at)`
- ⚠️ `.env.local` `SUPABASE_DATABASE_URL` 비밀번호가 옛값 — 스크립트 실행 전 신규 비번으로 교체 필요.

**산출물**: schema.sql diff, 적용 로그(테이블별 row 수).

---

## Phase 1 — 인증 + 도메인 회원가입

- deps 추가: `jose`, `bcryptjs`
- `lib/auth.ts`(신규): `hashPassword`, `verifyPassword`, `signSession`, `verifySession`, `getSessionFromCookies`, `assertEmailDomain`
- `lib/queries.ts`: `findUserByEmail`, `insertUser`, `getUserById`
- API 신규:
  - `POST /api/auth/signup` — 도메인 검증 → 중복 검증 → 해시 → `status='pending'` insert
  - `POST /api/auth/login` — 검증 → `status='active'` 확인 → Set-Cookie(서명 JWT)
  - `POST /api/auth/logout` — 쿠키 만료
  - `GET /api/auth/me` — 현재 사용자
- UI:
  - `app/login/page.tsx` 전면 교체 — 실제 폼·에러·로딩, **"건너뛰기" 버튼 제거**, `alert(...)` 제거
  - `app/signup/page.tsx`(신규) — 이메일(도메인 안내)·비번·이름·학번·소속, 가입 후 "관리자 승인 대기" 안내
- `middleware.ts` 교체 — 쿠키 문자열 검사 → **JWT 서명·만료 검증**, `/signup` 공개 경로 추가, role 클레임 추출
- env: `AUTH_JWT_SECRET`, `ALLOWED_EMAIL_DOMAINS`, `SESSION_TTL` → `.env.example`·Vercel 반영

**완료 기준**: 가짜 인증 완전 제거, 도메인 외 이메일 가입 거부, 위조 쿠키로 접근 차단.

---

## Phase 2 — 권한(RBAC) + 서버측 가드

- `components/AppShell.tsx` — 가짜 `useState(false)` 제거. 서버(layout)에서 `me` 조회해 role을 `AdminContext`에 주입.
- `components/Ticker.tsx` — 무인증 관리자 토글 제거(또는 admin 전용 표시).
- `lib/auth.ts` — `requireRole(req, roles[])` 헬퍼.
- 가드 적용: `/api/requests/*/[id]` PATCH, `/api/notices` POST, `/api/incidents` POST, 그 외 변경 API 전부.
- `middleware.ts` matcher — 현재 `api/` 제외됨. API 보호를 위해 인증 필요한 API 경로 포함하도록 조정(공개 API는 화이트리스트).
- 클라 가드: 관리자 메뉴/탭(`Sidebar` NAV_ADMIN, `RequestTabs`)을 실제 role 기반 노출.

**완료 기준**: 비관리자가 변경 API 직접 호출 시 403. 새로고침해도 권한 유지.

---

## Phase 3 — 신청 ↔ 사용자 연결

- 신청 모달 4종(`components/modals/*`) — 본인 정보 자동 채움(읽기 전용), 수동 입력 제거.
- 요청 POST API — payload의 신원 필드를 서버 세션 `user_id`로 강제 주입(클라 신뢰 안 함).
- "내 신청 내역" — 일반 사용자는 본인(`user_id eq`) 것만 조회. 관리자는 전체 + 신청자 계정/이메일 표시.
- `lib/queries.ts` — 요청 조회에 `user_id` 필터 옵션.

**완료 기준**: 타인 명의 신청 불가, 본인 신청 추적 가능.

---

## Phase 4 — 공지/장애/네트워크 관리 화면

- `lib/queries.ts` — `updateNotice`, `deleteNotice`, `updateIncident`, `deleteIncident`, 네트워크 장비 CRUD.
- API — `PATCH/DELETE /api/notices/[id]`, `PATCH/DELETE /api/incidents/[id]`, `/api/network` CUD.
- UI:
  - `/notices` — 관리자: 작성/수정/삭제, 본문·고정·게시기간. 공개측: 게시기간/published 필터.
  - `/logs` — 장애 등록·상태 변경(processing↔done) UI, 대시보드 장애현황과 동기화.
  - `/network` — 장비 등록/수정/삭제.

**완료 기준**: 관리자가 코드 수정 없이 콘텐츠 관리. 비관리자는 읽기만.

---

## Phase 5 — 요청 관리 UX + 감사 로그

- 검색·상태필터·정렬·페이지네이션(REST `Range`/`limit·offset` + count).
- 반려 사유: 요청테이블 `reject_reason TEXT`, 거절 시 입력 모달.
- 일괄 처리(다중 선택 승인/거절), CSV 내보내기.
- 감사 로그: 모든 상태변경/CRUD 시 `soc_audit_log` 기록 + 관리자 감사 뷰.

---

## Phase 6 — 알림

- 상태 변경 시 신청자에게 이메일(Resend 권장; env `RESEND_API_KEY`).
- 템플릿(승인/거절/완료), 실패해도 본 흐름 무중단(베스트에포트 + 로깅).

---

## Phase 7 — 대시보드 실데이터화

- 수집 API(`POST /api/ingest`, 토큰 인증)로 센서/agent가 측정값 push.
- `soc_metrics` 시계열 테이블 + Vercel Cron 집계.
- 시계열 차트, 임계치 초과 시 장애/공지 자동 생성·경보.

---

## 교차 관심사

- 입력 검증: `zod`로 API 페이로드 스키마 검증 통일.
- RLS: 현재 service_role 키 서버 전용이라 즉시 위험 아님. anon 키 클라 노출 금지 원칙 문서화, 차후 RLS 정책.
- 에러 UX: 공통 토스트/에러 바운더리.
- 운영: `.env.example`·Vercel 환경변수 동기화, 신규 비번 반영.

## 권장 진행 순서

`Phase 0 → 1 → 2`를 한 묶음으로 먼저(보안 근간). 이후 `3 → 4 → 5`, 그다음 `6 → 7`.
Phase 1·2 전까지는 다른 관리 기능을 만들어도 무인증 상태라 의미가 약함.
