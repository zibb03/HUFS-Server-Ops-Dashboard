-- 2026-06-07 마이그레이션 — 코딩존 예약·출석 (AdvICE 이식, 시연용)
--
-- Supabase SQL Editor 에 그대로 붙여넣고 실행하세요.
-- 본 앱(Cursor_Practice 시연본)은 soc_ 접두사 + raw REST(service_role) 방식이라
-- RLS/RPC 없이 단순 테이블로 구성. (정원 체크는 앱 레이어에서 처리)

/* ─────────────── 과목 (1~4 고정) ─────────────── */
CREATE TABLE IF NOT EXISTS soc_coding_zone_subjects (
  id          INTEGER PRIMARY KEY,         -- 1~4
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

/* ─────────────── 수업 슬롯 ─────────────── */
CREATE TABLE IF NOT EXISTS soc_coding_zone_classes (
  id              BIGSERIAL PRIMARY KEY,
  subject_id      INTEGER NOT NULL,
  class_name      TEXT NOT NULL,
  assistant_name  TEXT NOT NULL,
  class_date      TEXT NOT NULL,               -- "YYYY-MM-DD"
  class_time      TEXT NOT NULL,               -- "14:00"
  week_day        TEXT,
  maximum_number  INTEGER NOT NULL DEFAULT 0,
  current_number  INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

/* ─────────────── 예약 + 출석 ─────────────── */
CREATE TABLE IF NOT EXISTS soc_coding_zone_registers (
  id               BIGSERIAL PRIMARY KEY,
  class_id         BIGINT NOT NULL,
  user_id          BIGINT,                     -- 데모 사용자 id (number)
  user_email       TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  user_student_num TEXT,
  attended         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI'),
  UNIQUE (class_id, user_id)                   -- 중복 예약 차단
);
CREATE INDEX IF NOT EXISTS idx_soc_cz_classes_subject_date ON soc_coding_zone_classes(subject_id, class_date);
CREATE INDEX IF NOT EXISTS idx_soc_cz_registers_user ON soc_coding_zone_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_soc_cz_registers_class ON soc_coding_zone_registers(class_id);

/* ─────────────── 시드 (과목 1~4) ─────────────── */
INSERT INTO soc_coding_zone_subjects (id, name) VALUES
  (1, '코딩존 A'),
  (2, '코딩존 B'),
  (3, '코딩존 C'),
  (4, '코딩존 D')
ON CONFLICT (id) DO NOTHING;
