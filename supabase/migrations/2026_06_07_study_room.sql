-- 2026-06-07 마이그레이션 — 스터디룸 예약 (ICE 스터디룸 이식, 시연용)
--
-- Supabase SQL Editor 에 그대로 붙여넣고 실행하세요.
-- soc_ 접두사 + raw REST(service_role) 방식. RLS/RPC 없이 단순 테이블.
--
-- 데모 단순화:
--   - 원본의 schedule(일자별 슬롯 생성) 테이블 미사용.
--     방 운영시간(open~close) 1시간 슬롯을 앱에서 동적 생성하고, 예약만 영속화.
--   - 슬롯 점유/정원 = 해당 방·시간 겹치는 활성 예약 수로 계산.
--   - 그룹 예약은 group_id 로 묶인 여러 행(참여자별 1행, is_holder=예약자).

/* ─────────────── 방 (정적) ─────────────── */
CREATE TABLE IF NOT EXISTS soc_study_rooms (
  id            BIGSERIAL PRIMARY KEY,
  room_number   TEXT NOT NULL UNIQUE,            -- "305", "409"
  room_type     TEXT NOT NULL DEFAULT 'GROUP',   -- 'GROUP' | 'INDIVIDUAL'
  capacity      INTEGER NOT NULL DEFAULT 4,      -- 최대 인원
  min_participants INTEGER NOT NULL DEFAULT 2,   -- 최소 인원(그룹만)
  location      TEXT,                            -- "3층"
  facilities    TEXT,                            -- 쉼표구분 "PC,화이트보드"
  open_time     TEXT NOT NULL DEFAULT '09:00',
  close_time    TEXT NOT NULL DEFAULT '23:00',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

/* ─────────────── 예약 (+ 입실/그룹) ─────────────── */
CREATE TABLE IF NOT EXISTS soc_study_reservations (
  id               BIGSERIAL PRIMARY KEY,
  group_id         TEXT,                          -- 그룹 예약 묶음 키(개인이면 본인 단독)
  room_number      TEXT NOT NULL,
  room_type        TEXT NOT NULL,
  schedule_date    TEXT NOT NULL,                 -- "YYYY-MM-DD"
  start_time       TEXT NOT NULL,                 -- "14:00"
  end_time         TEXT NOT NULL,                 -- "16:00" (1~2시간)
  user_id          BIGINT,                        -- 데모 사용자 id
  user_email       TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  user_student_num TEXT,
  is_holder        BOOLEAN NOT NULL DEFAULT TRUE, -- 그룹 예약자(주최) 여부
  status           TEXT NOT NULL DEFAULT 'RESERVED',
  -- RESERVED | ENTRANCE | LATE | NO_SHOW | COMPLETED | CANCELLED
  enter_time       TEXT,                          -- 실제 입실 시각
  qr_token         TEXT UNIQUE,                   -- QR 입실용 토큰
  created_at       TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);
CREATE INDEX IF NOT EXISTS idx_soc_sr_user ON soc_study_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_soc_sr_room_date ON soc_study_reservations(room_number, schedule_date);
CREATE INDEX IF NOT EXISTS idx_soc_sr_group ON soc_study_reservations(group_id);

/* ─────────────── 패널티 ─────────────── */
CREATE TABLE IF NOT EXISTS soc_study_penalties (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT,
  reservation_id BIGINT,
  reason         TEXT NOT NULL,                   -- CANCEL | LATE | NO_SHOW | ADMIN
  penalty_end    TEXT NOT NULL,                   -- 만료 시각 "YYYY-MM-DD HH24:MI"
  status         TEXT NOT NULL DEFAULT 'VALID',   -- VALID | EXPIRED
  created_at     TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);
CREATE INDEX IF NOT EXISTS idx_soc_sp_user ON soc_study_penalties(user_id);

-- 이미 테이블을 만든 경우 대비 (facilities 컬럼 보강)
ALTER TABLE soc_study_rooms ADD COLUMN IF NOT EXISTS facilities TEXT;

/* ─────────────── 시드 (실제 호실 305/409 + 데모 개인실) ─────────────── */
-- 코드(프론트엔드)에서 확인된 실제 호실은 305(3층)·409(4층) 둘뿐.
-- 개인실(410/411)은 개인예약 시연용으로 추가.
-- 재실행 시 시설/위치 갱신되도록 ON CONFLICT DO UPDATE.
INSERT INTO soc_study_rooms (room_number, room_type, capacity, min_participants, location, facilities, open_time, close_time) VALUES
  ('305', 'GROUP',      4, 2, '3층', 'PC,화이트보드',              '09:00', '23:00'),
  ('409', 'GROUP',      4, 2, '4층', '화이트보드,대형 모니터,PC',  '09:00', '23:00'),
  ('410', 'INDIVIDUAL', 1, 1, '4층', 'PC',                        '09:00', '23:00'),
  ('411', 'INDIVIDUAL', 1, 1, '4층', 'PC',                        '09:00', '23:00')
ON CONFLICT (room_number) DO UPDATE
  SET location = EXCLUDED.location, facilities = EXCLUDED.facilities;
