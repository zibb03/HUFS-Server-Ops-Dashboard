-- 2026-05-21 마이그레이션
-- 장애(인시던트) 상세 본문 컬럼 추가
--
-- Supabase SQL Editor에 그대로 붙여넣고 실행하세요.

ALTER TABLE soc_incidents ADD COLUMN IF NOT EXISTS body TEXT;
