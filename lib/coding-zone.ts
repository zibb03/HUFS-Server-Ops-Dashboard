// 코딩존 — 시간창 규칙 + 쿼리 (AdvICE 이식, 시연용 / raw REST)
//
// 원본 규칙(인수인계 4.2):
//   - 예약/조회가 열리는 시간: 매주 목 16:00 ~ 일 24:00 (Asia/Seoul)
//   - 노출 수업: 항상 "다음 주(월~일)"
// 시연본이라 RPC 없이 raw REST + 앱 레이어 정원 체크. (데모 단일 사용자라 레이스 무시 가능)

import { sbSelect, sbSelectOne, sbInsert, sbUpdate, sbDelete } from './supabase'
import { T } from './tables'
import type {
  CodingZoneSubject, CodingZoneClassRow, CodingZoneClassWithMine,
  CodingZoneRegisterRow, CodingZoneMyReservation, CodingZoneClassPayload, CzReserveResult,
} from './types'

/* ─────────────── 시간창 ─────────────── */

// 시연용: 시간창 제약 해제 (항상 예약 가능).
// 실제 운영 시엔 아래 주석 로직으로 복원 (목 16:00 ~ 일 24:00).
export function isReservationOpen(_now: Date = nowKST()): boolean {
  return true
  // const day = _now.getDay(), hour = _now.getHours()
  // if (day === 4) return hour >= 16
  // return day === 5 || day === 6 || day === 0
}

export function nextWeekRange(now: Date = nowKST()): { start: string; end: string } {
  const d = new Date(now)
  const day = d.getDay()
  const diffToMonday = (day === 0 ? -6 : 1 - day)
  const thisMonday = new Date(d)
  thisMonday.setDate(d.getDate() + diffToMonday)
  const nextMonday = new Date(thisMonday)
  nextMonday.setDate(thisMonday.getDate() + 7)
  const nextSunday = new Date(nextMonday)
  nextSunday.setDate(nextMonday.getDate() + 6)
  return { start: ymd(nextMonday), end: ymd(nextSunday) }
}

function nowKST(): Date {
  const utc = Date.now() + new Date().getTimezoneOffset() * 60000
  return new Date(utc + 9 * 3600 * 1000)
}
function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/* ─────────────── 조회 ─────────────── */

export async function getSubjects(): Promise<CodingZoneSubject[]> {
  return sbSelect<CodingZoneSubject>(T.czSubjects, { order: 'id.asc' })
}

export async function getClassesForNextWeek(subjectId: number): Promise<CodingZoneClassRow[]> {
  // 시연용: "다음 주만" 제약 해제 — 개설된 해당 과목 수업을 날짜 무관 전부 노출.
  // 실제 운영 시엔 아래 nextWeekRange 로 범위 제한 복원.
  return sbSelect<CodingZoneClassRow>(T.czClasses, {
    order: 'class_date.asc',
    filters: { subject_id: `eq.${subjectId}` },
  })
  // const { start, end } = nextWeekRange()
  // const rows = await sbSelect<CodingZoneClassRow>(T.czClasses, {
  //   order: 'class_date.asc',
  //   filters: { subject_id: `eq.${subjectId}`, class_date: `gte.${start}` },
  // })
  // return rows.filter(c => c.class_date <= end)
}

// 로그인 사용자용 — 내가 예약한 수업 표시
export async function getClassesWithMine(subjectId: number, userId: number): Promise<CodingZoneClassWithMine[]> {
  const classes = await getClassesForNextWeek(subjectId)
  if (classes.length === 0) return []
  const ids = classes.map(c => c.id).join(',')
  const mine = await sbSelect<{ class_id: number }>(T.czRegisters, {
    select: 'class_id',
    filters: { user_id: `eq.${userId}`, class_id: `in.(${ids})` },
  })
  const mineSet = new Set(mine.map(r => r.class_id))
  return classes.map(c => ({ ...c, reserved_by_me: mineSet.has(c.id) }))
}

// 내 예약/출결 현황 (수업 정보 조합)
export async function getMyReservations(userId: number): Promise<CodingZoneMyReservation[]> {
  const regs = await sbSelect<CodingZoneRegisterRow>(T.czRegisters, {
    order: 'created_at.desc',
    filters: { user_id: `eq.${userId}` },
  })
  if (regs.length === 0) return []
  const classIds = Array.from(new Set(regs.map(r => r.class_id))).join(',')
  const classes = await sbSelect<CodingZoneClassRow>(T.czClasses, {
    filters: { id: `in.(${classIds})` },
  })
  const cmap = new Map(classes.map(c => [c.id, c]))
  return regs.map(r => {
    const c = cmap.get(r.class_id)
    return {
      ...r,
      class_name: c?.class_name ?? '(삭제됨)',
      assistant_name: c?.assistant_name ?? '',
      class_date: c?.class_date ?? '',
      class_time: c?.class_time ?? '',
      subject_id: c?.subject_id ?? 0,
    }
  })
}

/* ─────────────── 예약 / 취소 (앱 레이어 정원 체크) ─────────────── */

export async function reserveClass(
  classId: number,
  user: { id: number; email: string; name: string; student_id: string },
): Promise<CzReserveResult> {
  const cls = await sbSelectOne<CodingZoneClassRow>(T.czClasses, { filters: { id: `eq.${classId}` } })
  if (!cls) return 'not_found'

  // 중복 예약 확인
  const dup = await sbSelectOne<{ id: number }>(T.czRegisters, {
    select: 'id', filters: { class_id: `eq.${classId}`, user_id: `eq.${user.id}` },
  })
  if (dup) return 'duplicate'

  // 정원 확인
  if (cls.current_number >= cls.maximum_number) return 'full'

  // 예약 + current+1
  await sbInsert(T.czRegisters, {
    class_id: classId,
    user_id: user.id,
    user_email: user.email,
    user_name: user.name,
    user_student_num: user.student_id,
  })
  await sbUpdate(T.czClasses, { id: `eq.${classId}` }, { current_number: cls.current_number + 1 })
  return 'ok'
}

export async function cancelClass(classId: number, userId: number): Promise<'ok' | 'not_found'> {
  const cls = await sbSelectOne<CodingZoneClassRow>(T.czClasses, { filters: { id: `eq.${classId}` } })
  const deleted = await sbDelete(T.czRegisters, { class_id: `eq.${classId}`, user_id: `eq.${userId}` })
  if (deleted === 0) return 'not_found'
  if (cls) {
    await sbUpdate(T.czClasses, { id: `eq.${classId}` }, { current_number: Math.max(0, cls.current_number - 1) })
  }
  return 'ok'
}

/* ─────────────── 관리자 — 수업 개설/삭제 ─────────────── */

export async function insertClass(payload: CodingZoneClassPayload): Promise<CodingZoneClassRow> {
  return sbInsert<CodingZoneClassRow>(T.czClasses, {
    subject_id: payload.subject_id,
    class_name: payload.class_name,
    assistant_name: payload.assistant_name,
    class_date: payload.class_date,
    class_time: payload.class_time,
    week_day: payload.week_day ?? null,
    maximum_number: payload.maximum_number,
    current_number: 0,
  })
}

export async function getAllClasses(): Promise<CodingZoneClassRow[]> {
  return sbSelect<CodingZoneClassRow>(T.czClasses, { order: 'class_date.desc' })
}

export async function deleteClass(id: number): Promise<'ok' | 'has_register' | 'not_found'> {
  const regs = await sbSelect<{ id: number }>(T.czRegisters, { select: 'id', filters: { class_id: `eq.${id}` } })
  if (regs.length > 0) return 'has_register'
  const deleted = await sbDelete(T.czClasses, { id: `eq.${id}` })
  return deleted > 0 ? 'ok' : 'not_found'
}

/* ─────────────── 조교 — 명단 / 출석 토글 ─────────────── */

export async function getRegistersByClass(classId: number): Promise<CodingZoneRegisterRow[]> {
  return sbSelect<CodingZoneRegisterRow>(T.czRegisters, {
    order: 'user_student_num.asc', filters: { class_id: `eq.${classId}` },
  })
}

export async function toggleAttendance(registerId: number): Promise<number> {
  const cur = await sbSelectOne<{ attended: boolean }>(T.czRegisters, {
    select: 'attended', filters: { id: `eq.${registerId}` },
  })
  if (!cur) return 0
  const rows = await sbUpdate<{ id: number }>(T.czRegisters, { id: `eq.${registerId}` }, { attended: !cur.attended })
  return rows.length
}
