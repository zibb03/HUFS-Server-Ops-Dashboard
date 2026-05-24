-- 2026-05-21 마이그레이션
-- 신청 4종에 반려 사유(reject_reason)와 신청자 ID(user_id) 컬럼 추가
-- - reject_reason: 관리자가 거절 시 입력하는 사유
-- - user_id: 서버에서 세션 사용자 ID로 강제 주입 (본인 신청 내역 필터링용)
--
-- Supabase SQL Editor에 그대로 붙여넣고 실행하세요.

ALTER TABLE soc_ip_requests          ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE soc_equipment_requests   ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE soc_printer_requests     ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE soc_maintenance_requests ADD COLUMN IF NOT EXISTS reject_reason TEXT;

ALTER TABLE soc_ip_requests          ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE soc_equipment_requests   ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE soc_printer_requests     ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE soc_maintenance_requests ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- 조회 성능
CREATE INDEX IF NOT EXISTS idx_soc_ip_requests_user_id          ON soc_ip_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_soc_equipment_requests_user_id   ON soc_equipment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_soc_printer_requests_user_id     ON soc_printer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_soc_maintenance_requests_user_id ON soc_maintenance_requests(user_id);
