-- Supabase / Postgres 스키마
-- Supabase 대시보드 → SQL Editor 에 그대로 붙여 넣어 실행하세요.
--
-- 본 Supabase DB 는 여러 앱(SOC 외 다른 앱)과 공유합니다.
-- 따라서 이 앱이 사용하는 모든 테이블에는 `soc_` 접두사를 붙입니다.
--
-- created_at 기본값을 KST 'YYYY-MM-DD HH:MI' 형식의 TEXT 로 통일
-- (기존 SQLite 데이터와 화면 표기 호환)

/* ─────────────── 단일 상태 행 (id=1) ─────────────── */

CREATE TABLE IF NOT EXISTS soc_server_status (
  id              INTEGER PRIMARY KEY,
  temperature     REAL    NOT NULL,
  humidity        REAL    NOT NULL,
  max_temp        REAL    NOT NULL,
  min_temp        REAL    NOT NULL,
  fire_detected   INTEGER NOT NULL DEFAULT 0,
  overall_status  TEXT    NOT NULL DEFAULT 'normal',
  uptime_percent  REAL    NOT NULL DEFAULT 99.97,
  updated_at      TEXT    NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

CREATE TABLE IF NOT EXISTS soc_security_status (
  id                    INTEGER PRIMARY KEY,
  threat_level          INTEGER NOT NULL DEFAULT 10,
  national_threat_level INTEGER NOT NULL DEFAULT 10,
  updated_at            TEXT    NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

CREATE TABLE IF NOT EXISTS soc_server_load (
  id          INTEGER PRIMARY KEY,
  web_server  INTEGER NOT NULL,
  db_server   INTEGER NOT NULL,
  network     INTEGER NOT NULL,
  storage     INTEGER NOT NULL,
  updated_at  TEXT    NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

/* ─────────────── 목록 ─────────────── */

CREATE TABLE IF NOT EXISTS soc_incidents (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'processing',
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

CREATE TABLE IF NOT EXISTS soc_notices (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'general',
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD')
);

/* ─────────────── 신청 (status 컬럼 포함) ─────────────── */

CREATE TABLE IF NOT EXISTS soc_ip_requests (
  id             BIGSERIAL PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  department     TEXT NOT NULL,
  student_id     TEXT NOT NULL,
  purpose        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

CREATE TABLE IF NOT EXISTS soc_equipment_requests (
  id             BIGSERIAL PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  rental_start   TEXT NOT NULL,
  rental_end     TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

CREATE TABLE IF NOT EXISTS soc_printer_requests (
  id             BIGSERIAL PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  printer_id     TEXT NOT NULL,
  copies         INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

CREATE TABLE IF NOT EXISTS soc_maintenance_requests (
  id             BIGSERIAL PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  equipment_desc TEXT NOT NULL,
  issue_detail   TEXT NOT NULL,
  urgency        TEXT NOT NULL DEFAULT 'normal',
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

/* ─────────────── 네트워크 장비 ─────────────── */

CREATE TABLE IF NOT EXISTS soc_network_devices (
  id          BIGSERIAL PRIMARY KEY,
  hostname    TEXT NOT NULL,
  ip_address  TEXT NOT NULL,
  mac_address TEXT NOT NULL,
  device_type TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'online',
  last_seen   TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

/* ─────────────── Seed data ─────────────── */

INSERT INTO soc_server_status (id, temperature, humidity, max_temp, min_temp, fire_detected, overall_status, uptime_percent)
VALUES (1, 22.0, 45.0, 25.0, 18.0, 0, 'normal', 99.97)
ON CONFLICT (id) DO NOTHING;

INSERT INTO soc_security_status (id, threat_level, national_threat_level)
VALUES (1, 10, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO soc_server_load (id, web_server, db_server, network, storage)
VALUES (1, 30, 55, 20, 72)
ON CONFLICT (id) DO NOTHING;

INSERT INTO soc_incidents (title, status, created_at) VALUES
  ('학과 네트워크 지연',             'processing', '2024-05-22 09:15'),
  ('프린터 클라이언트 #4 오프라인',  'processing', '2024-05-21 14:30'),
  ('무단 로그인 시도 5회 차단',      'done',       '2024-05-20 22:44'),
  ('DB 서버 응답 지연 해결',         'done',       '2024-05-19 18:10')
ON CONFLICT DO NOTHING;

INSERT INTO soc_notices (title, type, created_at) VALUES
  ('전체 서버 통합 업그레이드 프로그램 시작',            'notice',  '2024-05-22'),
  ('보안 강화를 위한 새로운 네트워크 보안 프로토콜 적용', 'notice',  '2024-05-22'),
  ('서버실 출입 시 각 층 증명에 대한 업데이트 지침',      'info',    '2024-05-21'),
  ('2024년 2분기 서버 정기 점검 일정 안내',              'general', '2024-05-18')
ON CONFLICT DO NOTHING;

INSERT INTO soc_network_devices (hostname, ip_address, mac_address, device_type, status, last_seen) VALUES
  ('web-server-01',  '10.0.1.10',  'AA:BB:CC:DD:EE:01', '웹 서버',     'online',  '2024-05-22 10:00'),
  ('db-server-01',   '10.0.1.20',  'AA:BB:CC:DD:EE:02', 'DB 서버',     'online',  '2024-05-22 10:00'),
  ('db-server-02',   '10.0.1.21',  'AA:BB:CC:DD:EE:03', 'DB 서버',     'online',  '2024-05-22 10:00'),
  ('file-server-01', '10.0.1.30',  'AA:BB:CC:DD:EE:04', '파일 서버',   'online',  '2024-05-22 10:00'),
  ('backup-server',  '10.0.1.40',  'AA:BB:CC:DD:EE:05', '백업 서버',   'warning', '2024-05-22 08:30'),
  ('switch-core-01', '10.0.0.1',   'AA:BB:CC:DD:EE:06', '코어 스위치', 'online',  '2024-05-22 10:00'),
  ('switch-floor-2', '10.0.0.2',   'AA:BB:CC:DD:EE:07', '층별 스위치', 'online',  '2024-05-22 10:00'),
  ('firewall-01',    '10.0.0.254', 'AA:BB:CC:DD:EE:08', '방화벽',      'online',  '2024-05-22 10:00'),
  ('printer-srv-01', '10.0.2.10',  'AA:BB:CC:DD:EE:09', '프린터 서버', 'offline', '2024-05-21 14:30'),
  ('ntp-server',     '10.0.1.50',  'AA:BB:CC:DD:EE:0A', 'NTP 서버',    'online',  '2024-05-22 10:00')
ON CONFLICT DO NOTHING;

/* ─────────────── RLS (서비스 롤 키로만 접근하므로 비활성 권장) ─────────────── */
-- 이 앱은 서버(Next.js API Route)에서만 SUPABASE_SERVICE_ROLE_KEY 로 접근합니다.
-- 서비스 롤 키는 RLS 를 자동으로 우회하므로 별도 정책이 필요 없습니다.
-- 클라이언트에서 anon 키로 직접 접근할 계획이 있다면 RLS 정책을 추가하세요.
