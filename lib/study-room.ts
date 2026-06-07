// 스터디룸 예약 — 규칙 + 쿼리 (ICE 스터디룸 이식, 시연용 / raw REST)
//
// 데모 단순화: schedule 테이블 없이 방 운영시간 1시간 슬롯을 동적 생성.
// 슬롯 정원 = 해당 방·시간 겹치는 활성 예약 행 수. (그룹은 참여자별 1행)
// 비관적 락 대신 앱 레이어 체크 (데모 단일 사용자라 무방).
// 시각 계산은 Vercel(UTC) 기준 KST 환산.

import { sbSelect, sbSelectOne, sbInsert, sbUpdate } from './supabase'
import { T } from './tables'
import type {
  StudyRoomRow, StudyReservationRow, StudyReservationGroup, StudyPenaltyRow,
  StudySlot, StudyRoomPayload, StudyReserveResult, StudyCheckInResult,
  StudyCancelResult, StudyExtendResult, StudyReservationStatus,
} from './types'

const ACTIVE: StudyReservationStatus[] = ['RESERVED', 'ENTRANCE', 'LATE']
const PENALTY_DAYS: Record<string, number> = { CANCEL: 2, LATE: 3, NO_SHOW: 5, ADMIN: 7 }

/* ─────────────── 시각 헬퍼 (KST) ─────────────── */

function nowKstMs(): number { return Date.now() + 9 * 3600 * 1000 } // UTC 서버 기준 KST 벽시계 ms
function toKstMs(dateStr: string, timeStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h, mi] = timeStr.split(':').map(Number)
  return Date.UTC(y, mo - 1, d, h, mi)
}
function nowKstParts() {
  const k = new Date(nowKstMs())
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`,
    minutes: k.getUTCHours() * 60 + k.getUTCMinutes(),
  }
}
function hm(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}
function fmtHour(h: number): string { return `${String(h).padStart(2, '0')}:00` }
function addMinKstFmt(ms: number): string {
  const k = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())} ${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`
}
function token(): string {
  // 데모용 32자 토큰
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + '0'.repeat(32)).slice(0, 32)
}

/* ─────────────── 방 ─────────────── */

export async function getRooms(includeInactive = false): Promise<StudyRoomRow[]> {
  const filters: Record<string, string> = {}
  if (!includeInactive) filters.is_active = 'eq.true'
  return sbSelect<StudyRoomRow>(T.studyRooms, { order: 'room_number.asc', filters })
}

export async function getRoomByNumber(roomNumber: string): Promise<StudyRoomRow | null> {
  return sbSelectOne<StudyRoomRow>(T.studyRooms, { filters: { room_number: `eq.${roomNumber}` } })
}

/* ─────────────── 슬롯(동적 생성) ─────────────── */

// 특정 방·날짜의 1시간 슬롯 목록 + 정원/예약현황
export async function getSlots(roomNumber: string, date: string): Promise<StudySlot[]> {
  const room = await getRoomByNumber(roomNumber)
  if (!room) return []
  const regs = await sbSelect<StudyReservationRow>(T.studyReservations, {
    filters: { room_number: `eq.${roomNumber}`, schedule_date: `eq.${date}` },
  })
  const active = regs.filter(r => ACTIVE.includes(r.status))
  const open = hm(room.open_time), close = hm(room.close_time)
  const { date: today, minutes: nowMin } = nowKstParts()

  const slots: StudySlot[] = []
  for (let h = Math.floor(open / 60); h < Math.floor(close / 60); h++) {
    const sMin = h * 60, eMin = (h + 1) * 60
    // 이 슬롯과 겹치는 활성 예약 행 수
    const current = active.filter(r => hm(r.start_time) < eMin && hm(r.end_time) > sMin).length
    // 지난 슬롯(오늘이면 종료시간 경과 / 과거 날짜)은 예약 불가
    const past = date < today || (date === today && eMin <= nowMin)
    slots.push({
      start_time: fmtHour(h),
      end_time: fmtHour(h + 1),
      current,
      capacity: room.capacity,
      available: !past && current < room.capacity,
    })
  }
  return slots
}

/* ─────────────── 패널티 / 중복 체크 ─────────────── */

export async function getActivePenalty(userId: number): Promise<StudyPenaltyRow | null> {
  const rows = await sbSelect<StudyPenaltyRow>(T.studyPenalties, {
    filters: { user_id: `eq.${userId}`, status: `eq.VALID` },
  })
  const now = nowKstMs()
  return rows.find(p => toKstMs(p.penalty_end.slice(0, 10), p.penalty_end.slice(11, 16) || '23:59') > now) ?? null
}

async function hasActiveReservation(userId: number): Promise<boolean> {
  const rows = await sbSelect<StudyReservationRow>(T.studyReservations, {
    select: 'id,status', filters: { user_id: `eq.${userId}`, status: `in.(RESERVED,ENTRANCE,LATE)` },
  })
  return rows.length > 0
}

// 한 방·날짜·시간범위에서 겹치는 활성 예약 행 수 (정원 검사용)
async function overlapCount(roomNumber: string, date: string, start: string, end: string): Promise<number> {
  const regs = await sbSelect<StudyReservationRow>(T.studyReservations, {
    select: 'start_time,end_time,status', filters: { room_number: `eq.${roomNumber}`, schedule_date: `eq.${date}` },
  })
  const s = hm(start), e = hm(end)
  return regs.filter(r => ACTIVE.includes(r.status) && hm(r.start_time) < e && hm(r.end_time) > s).length
}

/* ─────────────── 예약 (개인 / 그룹) ─────────────── */

interface ReserveBase {
  roomNumber: string; date: string; start: string; end: string
  user: { id: number; email: string; name: string; student_id: string }
}

// 공통 시간/정원 검증
function validDuration(start: string, end: string): boolean {
  const d = hm(end) - hm(start)
  return d === 60 || d === 120   // 1~2시간
}

export async function reserveIndividual(b: ReserveBase): Promise<StudyReserveResult> {
  const room = await getRoomByNumber(b.roomNumber)
  if (!room || room.room_type !== 'INDIVIDUAL') return 'not_found'
  if (!room.is_active) return 'closed'
  if (!validDuration(b.start, b.end)) return 'invalid_participants'
  if (await getActivePenalty(b.user.id)) return 'penalty'
  if (await hasActiveReservation(b.user.id)) return 'duplicate'
  if (await overlapCount(b.roomNumber, b.date, b.start, b.end) >= room.capacity) return 'full'

  const gid = token()
  await sbInsert(T.studyReservations, {
    group_id: gid, room_number: b.roomNumber, room_type: 'INDIVIDUAL',
    schedule_date: b.date, start_time: b.start, end_time: b.end,
    user_id: b.user.id, user_email: b.user.email, user_name: b.user.name,
    user_student_num: b.user.student_id, is_holder: true, status: 'RESERVED', qr_token: gid,
  })
  return 'ok'
}

export async function reserveGroup(
  b: ReserveBase,
  participants: { name: string; email: string }[],
): Promise<StudyReserveResult> {
  const room = await getRoomByNumber(b.roomNumber)
  if (!room || room.room_type !== 'GROUP') return 'not_found'
  if (!room.is_active) return 'closed'
  if (!validDuration(b.start, b.end)) return 'invalid_participants'

  const total = 1 + participants.length
  if (total < room.min_participants || total > room.capacity) return 'invalid_participants'
  if (await getActivePenalty(b.user.id)) return 'penalty'
  if (await hasActiveReservation(b.user.id)) return 'duplicate'
  if (await overlapCount(b.roomNumber, b.date, b.start, b.end) + total > room.capacity) return 'full'

  const gid = token()
  const base = {
    group_id: gid, room_number: b.roomNumber, room_type: 'GROUP' as const,
    schedule_date: b.date, start_time: b.start, end_time: b.end, status: 'RESERVED' as const,
  }
  // 예약자(holder)
  await sbInsert(T.studyReservations, {
    ...base, user_id: b.user.id, user_email: b.user.email, user_name: b.user.name,
    user_student_num: b.user.student_id, is_holder: true, qr_token: gid,
  })
  // 참여자
  for (const p of participants) {
    await sbInsert(T.studyReservations, {
      ...base, user_id: null, user_email: p.email, user_name: p.name,
      user_student_num: null, is_holder: false, qr_token: null,
    })
  }
  return 'ok'
}

/* ─────────────── 내 예약 (그룹 묶음) ─────────────── */

export async function getMyReservations(userId: number): Promise<StudyReservationGroup[]> {
  const mine = await sbSelect<StudyReservationRow>(T.studyReservations, {
    order: 'created_at.desc', filters: { user_id: `eq.${userId}` },
  })
  if (mine.length === 0) return []
  const gids = Array.from(new Set(mine.map(r => r.group_id).filter(Boolean))) as string[]
  const all = gids.length
    ? await sbSelect<StudyReservationRow>(T.studyReservations, { filters: { group_id: `in.(${gids.join(',')})` } })
    : []
  return mine.map(holder => ({
    ...holder,
    participants: all
      .filter(r => r.group_id === holder.group_id)
      .map(r => ({ name: r.user_name, email: r.user_email, status: r.status })),
  }))
}

/* ─────────────── 취소 ─────────────── */

export async function cancelReservation(id: number, userId: number): Promise<StudyCancelResult> {
  const r = await sbSelectOne<StudyReservationRow>(T.studyReservations, { filters: { id: `eq.${id}` } })
  if (!r) return 'not_found'
  if (r.user_id !== userId || !r.is_holder) return 'forbidden'
  if (r.status !== 'RESERVED') return 'too_late'

  const startMs = toKstMs(r.schedule_date, r.start_time)
  const now = nowKstMs()
  if (now >= startMs) return 'too_late'  // 시작 이후 취소 불가
  const penalize = now >= startMs - 60 * 60000  // 시작 1시간 이내 취소 → 패널티

  // 그룹 전체 취소
  await sbUpdate(T.studyReservations, { group_id: `eq.${r.group_id}` }, { status: 'CANCELLED' })
  if (penalize) {
    await addPenalty(userId, r.id, 'CANCEL')
    return 'penalty'
  }
  return 'ok'
}

/* ─────────────── QR 입실 ─────────────── */

export async function checkIn(qrToken: string): Promise<{ result: StudyCheckInResult; name?: string }> {
  const r = await sbSelectOne<StudyReservationRow>(T.studyReservations, { filters: { qr_token: `eq.${qrToken}` } })
  if (!r) return { result: 'not_found' }
  if (r.status !== 'RESERVED') return { result: 'already', name: r.user_name }

  const startMs = toKstMs(r.schedule_date, r.start_time)
  const endMs = toKstMs(r.schedule_date, r.end_time)
  const now = nowKstMs()

  let status: StudyCheckInResult
  if (now < startMs) return { result: 'too_early', name: r.user_name }
  else if (now <= startMs + 30 * 60000) status = 'ENTRANCE'
  else if (now < endMs) status = 'LATE'
  else status = 'NO_SHOW'

  const enter = addMinKstFmt(now)
  // 그룹 전체 상태 전이
  await sbUpdate(T.studyReservations, { group_id: `eq.${r.group_id}` },
    { status, enter_time: status === 'NO_SHOW' ? null : enter })

  if (status === 'LATE' && r.user_id) await addPenalty(r.user_id, r.id, 'LATE')
  if (status === 'NO_SHOW' && r.user_id) await addPenalty(r.user_id, r.id, 'NO_SHOW')

  return { result: status, name: r.user_name }
}

/* ─────────────── 연장 (+1시간) ─────────────── */

export async function extendReservation(id: number, userId: number): Promise<StudyExtendResult> {
  const r = await sbSelectOne<StudyReservationRow>(T.studyReservations, { filters: { id: `eq.${id}` } })
  if (!r) return 'not_found'
  if (r.user_id !== userId || !r.is_holder) return 'not_found'
  if (r.status !== 'ENTRANCE' && r.status !== 'LATE') return 'not_entered'

  const room = await getRoomByNumber(r.room_number)
  if (!room) return 'not_found'
  const newEnd = hm(r.end_time) + 60
  if (newEnd > hm(room.close_time)) return 'no_slot'

  // 다음 1시간 슬롯 정원 (현재 그룹 제외하고 카운트)
  const regs = await sbSelect<StudyReservationRow>(T.studyReservations, {
    filters: { room_number: `eq.${r.room_number}`, schedule_date: `eq.${r.schedule_date}` },
  })
  const groupSize = regs.filter(x => x.group_id === r.group_id && ACTIVE.includes(x.status)).length
  const others = regs.filter(x => x.group_id !== r.group_id && ACTIVE.includes(x.status)
    && hm(x.start_time) < newEnd && hm(x.end_time) > hm(r.end_time)).length
  if (others + groupSize > room.capacity) return 'full'

  await sbUpdate(T.studyReservations, { group_id: `eq.${r.group_id}` }, { end_time: fmtHour(newEnd / 60) })
  return 'ok'
}

/* ─────────────── 패널티 ─────────────── */

async function addPenalty(userId: number, reservationId: number | null, reason: string): Promise<void> {
  const days = PENALTY_DAYS[reason] ?? 2
  const end = addMinKstFmt(nowKstMs() + days * 24 * 3600 * 1000)
  await sbInsert(T.studyPenalties, {
    user_id: userId, reservation_id: reservationId, reason, penalty_end: end, status: 'VALID',
  })
}

export async function getMyPenalties(userId: number): Promise<StudyPenaltyRow[]> {
  return sbSelect<StudyPenaltyRow>(T.studyPenalties, {
    order: 'created_at.desc', filters: { user_id: `eq.${userId}` },
  })
}

/* ─────────────── 관리자 ─────────────── */

export async function getAllReservations(): Promise<StudyReservationRow[]> {
  return sbSelect<StudyReservationRow>(T.studyReservations, { order: 'created_at.desc', limit: 200 })
}

export async function adminForceCancel(id: number): Promise<'ok' | 'not_found'> {
  const r = await sbSelectOne<StudyReservationRow>(T.studyReservations, { filters: { id: `eq.${id}` } })
  if (!r) return 'not_found'
  await sbUpdate(T.studyReservations, { group_id: `eq.${r.group_id}` }, { status: 'CANCELLED' })
  return 'ok'
}

export async function getAllPenalties(): Promise<StudyPenaltyRow[]> {
  return sbSelect<StudyPenaltyRow>(T.studyPenalties, { order: 'created_at.desc', limit: 100 })
}

export async function expirePenalty(id: number): Promise<number> {
  const rows = await sbUpdate<{ id: number }>(T.studyPenalties, { id: `eq.${id}` }, { status: 'EXPIRED' })
  return rows.length
}

export async function createRoom(p: StudyRoomPayload): Promise<StudyRoomRow> {
  return sbInsert<StudyRoomRow>(T.studyRooms, {
    room_number: p.room_number, room_type: p.room_type, capacity: p.capacity,
    min_participants: p.min_participants ?? (p.room_type === 'GROUP' ? 2 : 1),
    location: p.location ?? null, facilities: p.facilities ?? null,
    open_time: p.open_time ?? '09:00', close_time: p.close_time ?? '23:00',
    is_active: true,
  })
}

export async function setRoomActive(roomNumber: string, active: boolean): Promise<number> {
  const rows = await sbUpdate<{ id: number }>(T.studyRooms, { room_number: `eq.${roomNumber}` }, { is_active: active })
  return rows.length
}
