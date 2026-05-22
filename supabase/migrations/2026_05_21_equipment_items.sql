-- 2026-05-21 마이그레이션
-- 대여 장비 카탈로그 테이블 신규
-- total_qty     : 총 보유 수량
-- available_qty : 현재 대여 가능 수량 (대여 승인 시 -1, 반납/거절 시 +1)
--
-- Supabase SQL Editor에 그대로 붙여넣고 실행하세요.

CREATE TABLE IF NOT EXISTS soc_equipment_items (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  total_qty     INTEGER NOT NULL DEFAULT 1,
  available_qty INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

-- 기존 EquipmentModal 하드코딩 장비를 옮긴 초기 데이터
INSERT INTO soc_equipment_items (name, total_qty, available_qty) VALUES
  ('노트북 (Dell XPS 13)',  5, 5),
  ('태블릿 (iPad Pro)',     3, 3),
  ('카메라 (Canon EOS R)',  2, 2),
  ('빔프로젝터',            4, 4)
ON CONFLICT (name) DO NOTHING;
