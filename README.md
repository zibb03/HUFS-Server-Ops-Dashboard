# HUFS ARES-SOC Dashboard

한국외국어대학교 AI로봇공학과(ARES-SOC)의 통합 서버 운영 대시보드.
서버실 환경(온도/습도/화재), 보안 위협 수준, 서버 부하, 장애 대응 현황, 공지사항,
그리고 IP·장비·프린터·유지보수 신청 흐름을 한 화면에서 관리합니다.

- **Production**: https://ares-soc-cc.vercel.app
- **Repo**: https://github.com/zibb03/HUFS-ICE-Server-Ops-Dashboard

## Tech Stack

| 영역 | 사용 기술 |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Data Access | Supabase **PostgREST** via `fetch` (no `supabase-js`) |
| Hosting | Vercel |
| CI/CD | GitHub → Vercel 자동 배포 |

## Project Structure

```
.
├── app/
│   ├── page.tsx                 # 대시보드 메인
│   ├── login/                   # 로그인 페이지
│   ├── logs/                    # 로그 페이지
│   ├── network/                 # 네트워크 장비 페이지
│   ├── notices/                 # 공지사항 페이지
│   ├── requests/                # 신청 페이지 (ip / equipment / printer / maintenance)
│   └── api/                     # API Routes (모두 Supabase REST 호출)
├── components/                  # 대시보드/리스트/모달 UI
├── lib/
│   ├── supabase.ts              # PostgREST fetch 클라이언트 (sbSelect/Insert/Update)
│   ├── queries.ts               # 도메인 쿼리 함수
│   ├── types.ts                 # Row/Payload 타입
│   └── admin-context.tsx        # 관리자 모드 컨텍스트
├── supabase/
│   └── schema.sql               # soc_* 테이블 + 시드 (멱등)
├── scripts/                     # 일회성 운영 스크립트
│   ├── apply-soc-schema.js      # schema.sql 적용
│   ├── seed-samples.js          # 추가 샘플 시드
│   ├── test-rest.js             # PostgREST 헬스 체크
│   └── vercel-env-push.js       # Vercel 환경변수 일괄 등록
├── middleware.ts                # 로그인 가드
├── DESIGN.md                    # 디자인 시스템 명세
└── vercel.json
```

## Database — `soc_` Prefix Convention

이 Supabase 프로젝트는 다른 앱과 한 DB 를 공유합니다.
본 앱의 모든 테이블은 **`soc_` 접두사**를 사용합니다.

| 테이블 | 용도 |
|---|---|
| `soc_server_status` | 서버실 환경 (온/습/화재) |
| `soc_security_status` | 위협 등급 (앱/국가) |
| `soc_server_load` | 웹/DB/네트워크/스토리지 부하 |
| `soc_incidents` | 장애 대응 |
| `soc_notices` | 공지사항 |
| `soc_network_devices` | 네트워크 장비 인벤토리 |
| `soc_ip_requests` | IP 신청 |
| `soc_equipment_requests` | 장비 대여 신청 |
| `soc_printer_requests` | 프린터 사용 신청 |
| `soc_maintenance_requests` | 유지보수 신청 |

## Environment Variables

`.env.example` 참고. 로컬에서는 `.env.local` 에 같은 키로 채워 넣으세요.

| Key | 용도 |
|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` (REST 베이스) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 라우트 전용 service_role JWT (RLS 우회) |
| `SUPABASE_DATABASE_URL` | 관리 스크립트용 Postgres 직접 접속 URL (Pooler) |

> `SUPABASE_SERVICE_ROLE_KEY` 는 절대 클라이언트에 노출 금지.
> Vercel 환경 변수에만 두고 `NEXT_PUBLIC_` 접두사 붙이지 않음.

## Local Development

```bash
npm install
cp .env.example .env.local      # 그 후 키 입력
npm run dev                     # http://localhost:3000
```

DB 가 비어 있다면 스키마/시드 적용:

```bash
node scripts/apply-soc-schema.js   # 테이블 + 기본 시드
node scripts/seed-samples.js       # 추가 샘플 데이터
node scripts/test-rest.js          # PostgREST 헬스 체크
```

## Deployment

### Vercel (자동)

`master` 브랜치에 push 시 자동 배포:

```bash
git push origin master
```

Vercel 이 빌드 → 환경 변수 주입 → `https://ares-soc-cc.vercel.app` 으로 promote 합니다.

### 환경 변수 갱신 시

`.env.local` 수정 후 한 줄로 Vercel 에 동기화:

```bash
node scripts/vercel-env-push.js
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 를 production/development 환경에 일괄 등록합니다.
(Preview 환경은 Vercel 대시보드에서 수동 추가)

## API Routes

모두 `app/api/**` 아래. 인증은 `middleware.ts` 의 쿠키 가드로 처리됨 (`/api/**` 제외).

| Path | Method | 설명 |
|---|---|---|
| `/api/dashboard` | GET | 대시보드 통합 데이터 |
| `/api/incidents` | GET / POST | 장애 목록 / 추가 |
| `/api/notices` | GET / POST | 공지사항 목록 / 추가 |
| `/api/network` | GET | 네트워크 장비 |
| `/api/requests/{ip,equipment,printer,maintenance}` | GET / POST | 신청 목록 / 등록 |
| `/api/requests/{...}/[id]` | PATCH | 신청 상태 변경 |

## License

내부 프로젝트 (한국외국어대학교 ARES-SOC).
