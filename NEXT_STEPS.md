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

Supabase SQL Editor에 순서대로 적용:

- [ ] `2026_05_21_body_and_banners.sql` — 공지 `body` 컬럼 + `soc_banners` 테이블
- [ ] `2026_05_21_incident_body.sql` — 장애 `body` 컬럼
- [ ] `2026_05_21_notice_public.sql` — 공지 `is_public` 컬럼
- [ ] `2026_05_21_equipment_items.sql` — `soc_equipment_items` 카탈로그 테이블
- [ ] `2026_05_21_request_reject_userid.sql` — 신청 4종에 `reject_reason`, `user_id` 컬럼

---

## 2. 미구현 기능

(현재 큰 미구현 항목 없음 — 필요 시 추가)

---

## 3. Cursor_Practice에서 **시연용 fake로만** 둘 것

이 부분은 ops-dashboard 이식 시 교체될 예정. 깊게 짓지 말 것.

| 항목 | 현재 (fake) | 이식 후 |
|---|---|---|
| 로그인 페이지 | "건너뛰기" 버튼 → `hufs_auth=1` 쿠키 | Google OAuth 콜백 |
| 세션 | `lib/session.ts`의 `DEMO_USER` 상수 (admin) | `auth.getUser()` + `profiles.role` |
| 이메일 알림 | (미구현) — 추가 시 `console.log` | Resend API |
| 모니터링 데이터 | seed (`server_status` 등) | k8s Node Exporter → Prometheus → ingest |

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
- [x] 신청 모달 4종 본인정보 자동채움 + POST에서 신원 강제 주입
- [x] 신청 PATCH 4종 `requireRole` 가드 + 유지보수 취소/되돌리기, 거절·완료 confirm
- [x] 공지 작성/수정/삭제 + 본문(body) + 공개/비공개(`is_public`)
- [x] 공지 게시판 상세 페이지 `/notices/[id]` (비공개는 관리자만)
- [x] `soc_banners` 테이블 + 관리 UI + Ticker 동적 fetch
- [x] 장애(인시던트) 등록/수정/삭제/상태전환 + `IncidentModal`
- [x] 네트워크 장비 등록/수정/삭제 + `NetworkDeviceModal`
- [x] 장비 대여 카탈로그(`soc_equipment_items`) + `/equipment` 관리 페이지
- [x] 장비 대여 모달 드롭다운 DB화 + 재고 차감/복구
- [x] 신청 4종: 반려 사유 입력 모달 + 목록에 반려 사유 표시
- [x] 신청 4종: 본인 신청만 조회(일반) / 전체(관리자) + 서버 user_id 주입
- [x] 신청 4종: 검색·상태 필터·정렬·페이지네이션 (클라이언트)
- [x] 신청 4종: 다중 선택 일괄 승인/거절 + CSV 내보내기 (UTF-8 BOM)
