-- todo_app 스키마
-- 동일 Supabase DB 를 여러 앱이 공유하므로 모든 테이블에 `todo_app_` 접두사 사용.
-- KST 기준 시간(timestamptz) 사용.

/* ─────────────── Users ─────────────── */
CREATE TABLE IF NOT EXISTS todo_app_users (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

/* ─────────────── Lists (할 일 목록/프로젝트) ─────────────── */
CREATE TABLE IF NOT EXISTS todo_app_lists (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES todo_app_users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#3b82f6',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_todo_app_lists_user ON todo_app_lists(user_id);

/* ─────────────── Todos (개별 할 일) ─────────────── */
CREATE TABLE IF NOT EXISTS todo_app_todos (
  id            BIGSERIAL PRIMARY KEY,
  list_id       BIGINT NOT NULL REFERENCES todo_app_lists(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  is_done       BOOLEAN NOT NULL DEFAULT FALSE,
  priority      TEXT NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_todo_app_todos_list ON todo_app_todos(list_id);
CREATE INDEX IF NOT EXISTS idx_todo_app_todos_done ON todo_app_todos(is_done);

/* ─────────────── Tags ─────────────── */
CREATE TABLE IF NOT EXISTS todo_app_tags (
  id       BIGSERIAL PRIMARY KEY,
  user_id  BIGINT NOT NULL REFERENCES todo_app_users(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  color    TEXT NOT NULL DEFAULT '#64748b',
  UNIQUE (user_id, name)
);

/* ─────────────── Todo ↔ Tag 다대다 ─────────────── */
CREATE TABLE IF NOT EXISTS todo_app_todo_tags (
  todo_id  BIGINT NOT NULL REFERENCES todo_app_todos(id) ON DELETE CASCADE,
  tag_id   BIGINT NOT NULL REFERENCES todo_app_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

/* ─────────────── updated_at 자동 갱신 ─────────────── */
CREATE OR REPLACE FUNCTION todo_app_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_todo_app_todos_updated_at ON todo_app_todos;
CREATE TRIGGER trg_todo_app_todos_updated_at
  BEFORE UPDATE ON todo_app_todos
  FOR EACH ROW EXECUTE FUNCTION todo_app_set_updated_at();

/* ─────────────── Seed data ─────────────── */
INSERT INTO todo_app_users (email, name, avatar_url) VALUES
  ('alice@example.com', 'Alice Kim',  NULL),
  ('bob@example.com',   'Bob Park',   NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO todo_app_lists (user_id, title, color, sort_order) VALUES
  ((SELECT id FROM todo_app_users WHERE email='alice@example.com'), '오늘 할 일',  '#3b82f6', 1),
  ((SELECT id FROM todo_app_users WHERE email='alice@example.com'), '장보기',      '#22c55e', 2),
  ((SELECT id FROM todo_app_users WHERE email='alice@example.com'), '개인 프로젝트','#a855f7', 3),
  ((SELECT id FROM todo_app_users WHERE email='bob@example.com'),   '업무',        '#f97316', 1),
  ((SELECT id FROM todo_app_users WHERE email='bob@example.com'),   '독서 리스트', '#0ea5e9', 2)
ON CONFLICT DO NOTHING;

INSERT INTO todo_app_tags (user_id, name, color) VALUES
  ((SELECT id FROM todo_app_users WHERE email='alice@example.com'), 'work',     '#ef4444'),
  ((SELECT id FROM todo_app_users WHERE email='alice@example.com'), 'personal', '#10b981'),
  ((SELECT id FROM todo_app_users WHERE email='alice@example.com'), 'urgent',   '#f59e0b'),
  ((SELECT id FROM todo_app_users WHERE email='bob@example.com'),   'work',     '#ef4444'),
  ((SELECT id FROM todo_app_users WHERE email='bob@example.com'),   'reading',  '#8b5cf6')
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO todo_app_todos (list_id, title, description, is_done, priority, due_date) VALUES
  ((SELECT id FROM todo_app_lists WHERE title='오늘 할 일'   AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com')),
   '회의록 정리', '2시 미팅 내용 정리하고 공유', FALSE, 'high',   CURRENT_DATE),
  ((SELECT id FROM todo_app_lists WHERE title='오늘 할 일'   AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com')),
   '코드 리뷰',    'PR #42 리뷰',                  TRUE,  'normal', CURRENT_DATE),
  ((SELECT id FROM todo_app_lists WHERE title='오늘 할 일'   AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com')),
   '저녁 운동',    '러닝 5km',                     FALSE, 'low',    CURRENT_DATE),
  ((SELECT id FROM todo_app_lists WHERE title='장보기'       AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com')),
   '우유 사기',    NULL,                            FALSE, 'normal', CURRENT_DATE + 1),
  ((SELECT id FROM todo_app_lists WHERE title='장보기'       AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com')),
   '계란 한 판',   NULL,                            FALSE, 'normal', CURRENT_DATE + 1),
  ((SELECT id FROM todo_app_lists WHERE title='개인 프로젝트' AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com')),
   'Supabase 연동', 'pg 라이브러리 도입 + 마이그레이션 작성', FALSE, 'urgent', CURRENT_DATE + 7),
  ((SELECT id FROM todo_app_lists WHERE title='개인 프로젝트' AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com')),
   '디자인 시안 검토','피그마 파일 검토',           FALSE, 'normal', CURRENT_DATE + 3),
  ((SELECT id FROM todo_app_lists WHERE title='업무'         AND user_id=(SELECT id FROM todo_app_users WHERE email='bob@example.com')),
   '주간 보고서 작성', NULL,                         FALSE, 'high',   CURRENT_DATE + 2),
  ((SELECT id FROM todo_app_lists WHERE title='업무'         AND user_id=(SELECT id FROM todo_app_users WHERE email='bob@example.com')),
   '클라이언트 미팅 준비', '슬라이드 정리',         FALSE, 'high',   CURRENT_DATE + 1),
  ((SELECT id FROM todo_app_lists WHERE title='업무'         AND user_id=(SELECT id FROM todo_app_users WHERE email='bob@example.com')),
   '이메일 답장',  '미답변 7건',                   TRUE,  'low',    CURRENT_DATE),
  ((SELECT id FROM todo_app_lists WHERE title='독서 리스트'   AND user_id=(SELECT id FROM todo_app_users WHERE email='bob@example.com')),
   '클린 코드 완독', NULL,                          FALSE, 'low',    CURRENT_DATE + 30),
  ((SELECT id FROM todo_app_lists WHERE title='독서 리스트'   AND user_id=(SELECT id FROM todo_app_users WHERE email='bob@example.com')),
   '실용주의 프로그래머 챕터 3', NULL,             FALSE, 'normal', CURRENT_DATE + 14)
ON CONFLICT DO NOTHING;

-- 완료된 항목은 completed_at 채워주기
UPDATE todo_app_todos SET completed_at = now()
WHERE is_done = TRUE AND completed_at IS NULL;

-- 일부 todo 에 태그 연결
INSERT INTO todo_app_todo_tags (todo_id, tag_id) VALUES
  ((SELECT id FROM todo_app_todos WHERE title='회의록 정리'    LIMIT 1),
   (SELECT id FROM todo_app_tags  WHERE name='work'     AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com'))),
  ((SELECT id FROM todo_app_todos WHERE title='Supabase 연동'  LIMIT 1),
   (SELECT id FROM todo_app_tags  WHERE name='urgent'   AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com'))),
  ((SELECT id FROM todo_app_todos WHERE title='Supabase 연동'  LIMIT 1),
   (SELECT id FROM todo_app_tags  WHERE name='personal' AND user_id=(SELECT id FROM todo_app_users WHERE email='alice@example.com'))),
  ((SELECT id FROM todo_app_todos WHERE title='주간 보고서 작성' LIMIT 1),
   (SELECT id FROM todo_app_tags  WHERE name='work'     AND user_id=(SELECT id FROM todo_app_users WHERE email='bob@example.com'))),
  ((SELECT id FROM todo_app_todos WHERE title='클린 코드 완독' LIMIT 1),
   (SELECT id FROM todo_app_tags  WHERE name='reading'  AND user_id=(SELECT id FROM todo_app_users WHERE email='bob@example.com')))
ON CONFLICT DO NOTHING;
