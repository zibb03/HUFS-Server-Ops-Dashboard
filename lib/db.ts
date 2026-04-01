import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH  = path.join(DATA_DIR, 'hufs.db')

// Next.js HMR 환경에서 중복 연결 방지
declare global {
  // eslint-disable-next-line no-var
  var _db: Database.Database | undefined
}

function createDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  initSchema(db)
  migrateSchema(db)
  seedIfEmpty(db)
  return db
}

export function getDb(): Database.Database {
  if (!globalThis._db) globalThis._db = createDb()
  return globalThis._db
}

/* ─────────────────────── Schema ─────────────────────── */
function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_status (
      id              INTEGER PRIMARY KEY,
      temperature     REAL    NOT NULL,
      humidity        REAL    NOT NULL,
      max_temp        REAL    NOT NULL,
      min_temp        REAL    NOT NULL,
      fire_detected   INTEGER NOT NULL DEFAULT 0,
      overall_status  TEXT    NOT NULL DEFAULT 'normal',
      uptime_percent  REAL    NOT NULL DEFAULT 99.97,
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS security_status (
      id                    INTEGER PRIMARY KEY,
      threat_level          INTEGER NOT NULL DEFAULT 10,
      national_threat_level INTEGER NOT NULL DEFAULT 10,
      updated_at            TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS server_load (
      id          INTEGER PRIMARY KEY,
      web_server  INTEGER NOT NULL,
      db_server   INTEGER NOT NULL,
      network     INTEGER NOT NULL,
      storage     INTEGER NOT NULL,
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'processing',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS notices (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS ip_requests (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      department     TEXT NOT NULL,
      student_id     TEXT NOT NULL,
      purpose        TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS equipment_requests (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      equipment_type TEXT NOT NULL,
      rental_start   TEXT NOT NULL,
      rental_end     TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS printer_requests (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      printer_id     TEXT NOT NULL,
      copies         INTEGER NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      equipment_desc TEXT NOT NULL,
      issue_detail   TEXT NOT NULL,
      urgency        TEXT NOT NULL DEFAULT 'normal',
      created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS network_devices (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      hostname    TEXT NOT NULL,
      ip_address  TEXT NOT NULL,
      mac_address TEXT NOT NULL,
      device_type TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'online',
      last_seen   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `)
}

/* ─────────────────────── Migrations ─────────────────────── */
function migrateSchema(db: Database.Database) {
  const tables = ['ip_requests', 'equipment_requests', 'printer_requests', 'maintenance_requests']
  for (const table of tables) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`)
    } catch {
      // 컬럼이 이미 존재하면 무시
    }
  }
}

/* ─────────────────────── Seed data ─────────────────────── */
function seedIfEmpty(db: Database.Database) {
  const hasStatus = db.prepare('SELECT COUNT(*) as c FROM server_status').get() as { c: number }
  if (hasStatus.c > 0) return  // 이미 시드됨

  db.prepare(`
    INSERT INTO server_status (id, temperature, humidity, max_temp, min_temp, fire_detected, overall_status, uptime_percent)
    VALUES (1, 22.0, 45.0, 25.0, 18.0, 0, 'normal', 99.97)
  `).run()

  db.prepare(`
    INSERT INTO security_status (id, threat_level, national_threat_level)
    VALUES (1, 10, 10)
  `).run()

  db.prepare(`
    INSERT INTO server_load (id, web_server, db_server, network, storage)
    VALUES (1, 30, 55, 20, 72)
  `).run()

  const insertIncident = db.prepare(
    'INSERT INTO incidents (title, status, created_at) VALUES (?, ?, ?)'
  )
  ;[
    ['학과 네트워크 지연',             'processing', '2024-05-22 09:15'],
    ['프린터 클라이언트 #4 오프라인',  'processing', '2024-05-21 14:30'],
    ['무단 로그인 시도 5회 차단',       'done',       '2024-05-20 22:44'],
    ['DB 서버 응답 지연 해결',          'done',       '2024-05-19 18:10'],
  ].forEach(([t, s, d]) => insertIncident.run(t, s, d))

  const insertNotice = db.prepare(
    'INSERT INTO notices (title, type, created_at) VALUES (?, ?, ?)'
  )
  ;[
    ['전체 서버 통합 업그레이드 프로그램 시작',            'notice',  '2024-05-22'],
    ['보안 강화를 위한 새로운 네트워크 보안 프로토콜 적용', 'notice',  '2024-05-22'],
    ['서버실 출입 시 각 층 증명에 대한 업데이트 지침',     'info',    '2024-05-21'],
    ['2024년 2분기 서버 정기 점검 일정 안내',              'general', '2024-05-18'],
  ].forEach(([t, tp, d]) => insertNotice.run(t, tp, d))

  const insertDevice = db.prepare(
    'INSERT INTO network_devices (hostname, ip_address, mac_address, device_type, status, last_seen) VALUES (?, ?, ?, ?, ?, ?)'
  )
  ;[
    ['web-server-01',  '10.0.1.10', 'AA:BB:CC:DD:EE:01', '웹 서버',     'online',  '2024-05-22 10:00'],
    ['db-server-01',   '10.0.1.20', 'AA:BB:CC:DD:EE:02', 'DB 서버',     'online',  '2024-05-22 10:00'],
    ['db-server-02',   '10.0.1.21', 'AA:BB:CC:DD:EE:03', 'DB 서버',     'online',  '2024-05-22 10:00'],
    ['file-server-01', '10.0.1.30', 'AA:BB:CC:DD:EE:04', '파일 서버',   'online',  '2024-05-22 10:00'],
    ['backup-server',  '10.0.1.40', 'AA:BB:CC:DD:EE:05', '백업 서버',   'warning', '2024-05-22 08:30'],
    ['switch-core-01', '10.0.0.1',  'AA:BB:CC:DD:EE:06', '코어 스위치', 'online',  '2024-05-22 10:00'],
    ['switch-floor-2', '10.0.0.2',  'AA:BB:CC:DD:EE:07', '층별 스위치', 'online',  '2024-05-22 10:00'],
    ['firewall-01',    '10.0.0.254','AA:BB:CC:DD:EE:08', '방화벽',      'online',  '2024-05-22 10:00'],
    ['printer-srv-01', '10.0.2.10', 'AA:BB:CC:DD:EE:09', '프린터 서버', 'offline', '2024-05-21 14:30'],
    ['ntp-server',     '10.0.1.50', 'AA:BB:CC:DD:EE:0A', 'NTP 서버',    'online',  '2024-05-22 10:00'],
  ].forEach(([h, ip, mac, type, status, seen]) => insertDevice.run(h, ip, mac, type, status, seen))
}
