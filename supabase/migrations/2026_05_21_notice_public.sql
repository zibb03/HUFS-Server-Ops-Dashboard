-- 2026-05-21 마이그레이션
-- 공지 공개 여부 컬럼 추가
-- is_public = true  → 모든 사용자에게 노출
-- is_public = false → 관리자(admin/manager)만 조회 가능
--
-- Supabase SQL Editor에 그대로 붙여넣고 실행하세요.

ALTER TABLE soc_notices ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;
