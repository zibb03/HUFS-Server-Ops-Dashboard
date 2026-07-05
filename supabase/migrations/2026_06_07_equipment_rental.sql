-- 2026-06-07 마이그레이션 — 기자재(장비) 대여 예약 (스터디룸 방식, 시연용)
--
-- Supabase SQL Editor 에 붙여넣고 실행.
-- 기존 카탈로그 soc_equipment_items 재사용. 날짜 기반 셀프 예약 테이블만 추가.
-- 가용 수량 = 총 수량 - 해당 기간 겹치는 활성 대여 수량 (스터디룸 슬롯 방식).

/* ─────────────── 대여 예약 ─────────────── */
CREATE TABLE IF NOT EXISTS soc_equipment_rentals (
  id               BIGSERIAL PRIMARY KEY,
  item_id          BIGINT NOT NULL,               -- soc_equipment_items.id
  item_name        TEXT NOT NULL,                 -- denormalized
  qty              INTEGER NOT NULL DEFAULT 1,
  start_date       TEXT NOT NULL,                 -- "YYYY-MM-DD"
  end_date         TEXT NOT NULL,                 -- "YYYY-MM-DD" (대여 마지막날)
  user_id          BIGINT,
  user_email       TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  user_student_num TEXT,
  status           TEXT NOT NULL DEFAULT 'RESERVED',
  -- RESERVED(예약) | RENTED(수령/대여중) | RETURNED(반납완료) | OVERDUE(연체) | CANCELLED(취소)
  picked_at        TEXT,                          -- 수령 시각
  returned_at      TEXT,                          -- 반납 시각
  created_at       TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);
CREATE INDEX IF NOT EXISTS idx_soc_er_user ON soc_equipment_rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_soc_er_item ON soc_equipment_rentals(item_id, start_date);

/* ─────────────── 카탈로그 시드 (없으면 추가) ─────────────── */
-- soc_equipment_items 는 기존 테이블. name UNIQUE 가정 하에 기자재 몇 개 보강.
INSERT INTO soc_equipment_items (name, total_qty, available_qty) VALUES
  ('노트북',        5, 5),
  ('DSLR 카메라',   3, 3),
  ('삼각대',        6, 6),
  ('빔프로젝터',    2, 2),
  ('HDMI 케이블',  10, 10),
  ('무선 마이크',   4, 4)
ON CONFLICT (name) DO NOTHING;
