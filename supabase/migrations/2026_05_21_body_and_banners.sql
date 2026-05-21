-- 2026-05-21 마이그레이션
-- 1) 공지 본문 컬럼 추가
-- 2) 상단 배너 테이블 신규 (Ticker 데이터 소스)
--
-- Supabase SQL Editor에 그대로 붙여넣고 실행하세요.

/* ── 공지 본문 ── */
ALTER TABLE soc_notices ADD COLUMN IF NOT EXISTS body TEXT;

/* ── 상단 배너 ── */
CREATE TABLE IF NOT EXISTS soc_banners (
  id         BIGSERIAL PRIMARY KEY,
  text       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI')
);

-- 기존 Ticker 하드코딩 텍스트를 옮긴 초기 배너 데이터
INSERT INTO soc_banners (text, sort_order, active) VALUES
  ('📢 2024년 5월 22일 (수) 전체 서버 통합 업그레이드 프로그램 시작', 1, true),
  ('📋 보안 강화를 위한 새로운 네트워크 보안 프로토콜 적용',           2, true),
  ('⚠️ 서버실 출입 시 각 층 증명에 대한 업데이트 지침 안내',           3, true),
  ('🔧 정기 점검: 매월 마지막 주 금요일 23:00 ~ 익일 02:00',          4, true),
  ('📌 IP 신청 처리 기간: 영업일 기준 2~3일 소요',                    5, true)
ON CONFLICT DO NOTHING;
