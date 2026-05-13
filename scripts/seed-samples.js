/* eslint-disable */
// soc_* 신청 테이블 + 추가 incidents/notices 시드.
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const envText = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
const url = (envText.match(/SUPABASE_DATABASE_URL\s*=\s*"?([^"\r\n]+)/) || [])[1]
if (!url) { console.error('DATABASE_URL 없음'); process.exit(1) }

const ipRequests = [
  ['김민준', '컴퓨터공학과', '20210123', '캡스톤 프로젝트 서버 배포용', 'approved',  '2026-05-08 09:30'],
  ['이서연', '전자공학과',   '20220045', '졸업작품 데이터 수집 서버',   'pending',   '2026-05-12 14:10'],
  ['박지호', '정보보호학과', '20200987', '학회 CTF 인프라 운영',        'completed', '2026-05-01 11:00'],
  ['최유나', '컴퓨터공학과', '20230012', '머신러닝 학습 서버',          'pending',   '2026-05-13 10:45'],
  ['정도윤', '소프트웨어학과','20210567', '동아리 웹 서비스 호스팅',     'rejected',  '2026-05-09 16:20'],
  ['강하린', '전자공학과',   '20220301', 'IoT 센서 게이트웨이',         'approved',  '2026-05-11 13:00'],
  ['윤재현', '정보통신학과', '20190876', '학생회 행사 페이지',          'completed', '2026-04-28 09:00'],
  ['임수아', '컴퓨터공학과', '20230456', '리눅스 실습 환경 구축',       'pending',   '2026-05-13 15:30'],
]

const equipmentRequests = [
  ['김민준', '노트북',         '2026-05-14', '2026-05-16', 'approved',  '2026-05-10 10:00'],
  ['이서연', '4K 카메라',      '2026-05-15', '2026-05-18', 'pending',   '2026-05-12 11:30'],
  ['박지호', '무선 마이크 세트','2026-05-13', '2026-05-13', 'completed', '2026-05-08 09:15'],
  ['최유나', '빔프로젝터',     '2026-05-20', '2026-05-22', 'approved',  '2026-05-11 14:00'],
  ['정도윤', '오실로스코프',   '2026-05-16', '2026-05-19', 'pending',   '2026-05-13 09:45'],
  ['강하린', '드론',           '2026-05-25', '2026-05-26', 'rejected',  '2026-05-10 16:30'],
  ['윤재현', '삼각대 + 조명',   '2026-05-14', '2026-05-15', 'approved',  '2026-05-12 13:20'],
]

const printerRequests = [
  ['김민준', 'PRN-LAB-01', 30,  'completed', '2026-05-13 09:10'],
  ['이서연', 'PRN-LAB-02', 5,   'pending',   '2026-05-13 14:20'],
  ['박지호', 'PRN-LIB-01', 120, 'approved',  '2026-05-12 11:00'],
  ['최유나', 'PRN-LAB-01', 8,   'completed', '2026-05-11 15:30'],
  ['정도윤', 'PRN-LIB-02', 45,  'completed', '2026-05-10 10:45'],
  ['강하린', 'PRN-LAB-03', 200, 'pending',   '2026-05-13 16:00'],
  ['임수아', 'PRN-LIB-01', 15,  'rejected',  '2026-05-09 13:15'],
]

const maintenanceRequests = [
  ['김민준', '강의실 503 빔프로젝터', '화면이 깜빡거립니다',                  'high',   'processing', '2026-05-12 09:30'],
  ['이서연', '연구실 데스크톱 #7',    '부팅 안 됨',                            'urgent', 'pending',    '2026-05-13 08:45'],
  ['박지호', '서버실 UPS',            'UPS 경고 소리가 계속 납니다',           'urgent', 'completed',  '2026-05-08 10:00'],
  ['최유나', '실습실 프린터 03',      '용지 걸림 + 토너 부족',                 'normal', 'completed',  '2026-05-09 11:20'],
  ['정도윤', '강의실 304 스크린',    '내려가지 않습니다',                     'normal', 'pending',    '2026-05-13 13:40'],
  ['강하린', '학과 라우터',          '간헐적 끊김',                            'high',   'processing', '2026-05-11 14:15'],
  ['윤재현', '실습실 에어컨',        '냉방 불량',                              'high',   'approved',   '2026-05-12 16:50'],
]

const moreIncidents = [
  ['DDoS 의심 트래픽 차단',         'done',       '2026-05-12 03:22'],
  ['스토리지 사용량 80% 경고',      'processing', '2026-05-13 06:10'],
  ['SSL 인증서 갱신 완료',          'done',       '2026-05-10 02:00'],
  ['DB 백업 스크립트 오류',         'processing', '2026-05-13 04:30'],
  ['웹서버 응답 시간 일시 상승',    'done',       '2026-05-11 15:45'],
]

const moreNotices = [
  ['MFA(이중 인증) 의무 적용 안내',           'notice',  '2026-05-13'],
  ['신규 GPU 서버 도입 — 사용 신청 접수 중',  'info',    '2026-05-12'],
  ['5월 정기 점검 일정 (5/20 02:00~05:00)',   'notice',  '2026-05-10'],
  ['클라우드 백업 정책 변경 사항',            'general', '2026-05-08'],
]

;(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await c.connect()
  console.log('connected')

  const tx = async (label, sql, rows) => {
    let n = 0
    for (const r of rows) { await c.query(sql, r); n++ }
    console.log(`✓ ${label.padEnd(24)} +${n} rows`)
  }

  await tx('soc_ip_requests',
    `INSERT INTO soc_ip_requests (applicant_name, department, student_id, purpose, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`, ipRequests)

  await tx('soc_equipment_requests',
    `INSERT INTO soc_equipment_requests (applicant_name, equipment_type, rental_start, rental_end, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`, equipmentRequests)

  await tx('soc_printer_requests',
    `INSERT INTO soc_printer_requests (applicant_name, printer_id, copies, status, created_at)
     VALUES ($1,$2,$3,$4,$5)`, printerRequests)

  await tx('soc_maintenance_requests',
    `INSERT INTO soc_maintenance_requests (applicant_name, equipment_desc, issue_detail, urgency, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`, maintenanceRequests)

  await tx('soc_incidents (extra)',
    `INSERT INTO soc_incidents (title, status, created_at) VALUES ($1,$2,$3)`, moreIncidents)

  await tx('soc_notices (extra)',
    `INSERT INTO soc_notices (title, type, created_at) VALUES ($1,$2,$3)`, moreNotices)

  console.log('\n--- Totals ---')
  const tables = [
    'soc_incidents','soc_notices','soc_network_devices',
    'soc_ip_requests','soc_equipment_requests','soc_printer_requests','soc_maintenance_requests',
  ]
  for (const t of tables) {
    const r = await c.query(`SELECT COUNT(*)::int AS c FROM ${t}`)
    console.log(`  ${t.padEnd(28)} ${r.rows[0].c}`)
  }
  await c.end()
})().catch(e => { console.error(e.message); process.exit(1) })
