// 기자재(장비) 대여 — 규칙 + 쿼리 (스터디룸 방식, 시연용 / raw REST)
//
// 카탈로그(soc_equipment_items)는 재사용, 예약은 soc_equipment_rentals.
// 가용 수량 = 총 수량 - 해당 기간 겹치는 활성 대여 수량. (스터디룸 슬롯 방식, 단위는 '일')
// 연체(OVERDUE)는 저장하지 않고 조회 시 계산: RENTED + end_date < 오늘.

import { sbSelect, sbSelectOne, sbInsert, sbUpdate } from './supabase'
import { getEquipmentItems, getEquipmentItemById } from './queries'
import { T } from './tables'
import type {
  EquipmentRentalRow, EquipmentItemAvail, EquipmentReserveResult,
  EquipmentRentalStatus,
} from './types'

const ACTIVE: EquipmentRentalStatus[] = ['RESERVED', 'RENTED', 'OVERDUE']

/* ─────────────── 날짜 헬퍼 (KST) ─────────────── */

function todayKST(): string {
  const k = new Date(Date.now() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}`
}
function nowKstFmt(): string {
  const k = new Date(Date.now() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`
}
// 대여중이지만 반납일이 지난 경우 연체로 표시
function withOverdue(r: EquipmentRentalRow): EquipmentRentalRow {
  if (r.status === 'RENTED' && r.end_date < todayKST()) return { ...r, status: 'OVERDUE' }
  return r
}

/* ─────────────── 가용 수량 ─────────────── */

// 특정 기간 특정 아이템의 겹치는 활성 대여 수량 합
async function reservedQty(itemId: number, start: string, end: string, excludeId?: number): Promise<number> {
  const rows = await sbSelect<EquipmentRentalRow>(T.equipmentRentals, {
    select: 'id,qty,start_date,end_date,status', filters: { item_id: `eq.${itemId}` },
  })
  return rows
    .filter(r => ACTIVE.includes(r.status) && r.id !== excludeId
      && r.start_date <= end && r.end_date >= start)     // 날짜 구간 겹침
    .reduce((sum, r) => sum + r.qty, 0)
}

// 카탈로그 + (기간 주면) 가용 수량
export async function getCatalog(start?: string, end?: string): Promise<EquipmentItemAvail[]> {
  const items = await getEquipmentItems()
  const out: EquipmentItemAvail[] = []
  for (const it of items) {
    let available = it.total_qty
    if (start && end) available = it.total_qty - await reservedQty(it.id, start, end)
    out.push({ id: it.id, name: it.name, total_qty: it.total_qty, available: Math.max(0, available) })
  }
  return out
}

/* ─────────────── 연체 차단 ─────────────── */

async function hasOverdue(userId: number): Promise<boolean> {
  const rows = await sbSelect<EquipmentRentalRow>(T.equipmentRentals, {
    select: 'end_date,status', filters: { user_id: `eq.${userId}`, status: `eq.RENTED` },
  })
  const today = todayKST()
  return rows.some(r => r.end_date < today)
}

/* ─────────────── 예약 ─────────────── */

export async function reserve(
  itemId: number, qty: number, start: string, end: string,
  user: { id: number; email: string; name: string; student_id: string },
): Promise<EquipmentReserveResult> {
  const item = await getEquipmentItemById(itemId)
  if (!item) return 'not_found'
  if (!Number.isInteger(qty) || qty < 1) return 'invalid_qty'
  if (!start || !end || end < start || start < todayKST()) return 'invalid_date'
  if (await hasOverdue(user.id)) return 'overdue_block'

  const reserved = await reservedQty(itemId, start, end)
  if (item.total_qty - reserved < qty) return 'no_stock'

  await sbInsert(T.equipmentRentals, {
    item_id: itemId, item_name: item.name, qty,
    start_date: start, end_date: end,
    user_id: user.id, user_email: user.email, user_name: user.name, user_student_num: user.student_id,
    status: 'RESERVED',
  })
  return 'ok'
}

/* ─────────────── 내 대여 ─────────────── */

export async function getMyRentals(userId: number): Promise<EquipmentRentalRow[]> {
  const rows = await sbSelect<EquipmentRentalRow>(T.equipmentRentals, {
    order: 'created_at.desc', filters: { user_id: `eq.${userId}` },
  })
  return rows.map(withOverdue)
}

/* ─────────────── 취소 / 수령 / 반납 ─────────────── */

export async function cancel(id: number, userId: number): Promise<'ok' | 'not_found' | 'forbidden' | 'too_late'> {
  const r = await sbSelectOne<EquipmentRentalRow>(T.equipmentRentals, { filters: { id: `eq.${id}` } })
  if (!r) return 'not_found'
  if (r.user_id !== userId) return 'forbidden'
  if (r.status !== 'RESERVED') return 'too_late'   // 수령 후엔 취소 불가(반납해야 함)
  await sbUpdate(T.equipmentRentals, { id: `eq.${id}` }, { status: 'CANCELLED' })
  return 'ok'
}

export async function pickup(id: number, userId: number): Promise<'ok' | 'not_found' | 'forbidden' | 'invalid'> {
  const r = await sbSelectOne<EquipmentRentalRow>(T.equipmentRentals, { filters: { id: `eq.${id}` } })
  if (!r) return 'not_found'
  if (r.user_id !== userId) return 'forbidden'
  if (r.status !== 'RESERVED') return 'invalid'
  await sbUpdate(T.equipmentRentals, { id: `eq.${id}` }, { status: 'RENTED', picked_at: nowKstFmt() })
  return 'ok'
}

export async function returnItem(id: number, userId: number): Promise<'ok' | 'not_found' | 'forbidden' | 'invalid'> {
  const r = await sbSelectOne<EquipmentRentalRow>(T.equipmentRentals, { filters: { id: `eq.${id}` } })
  if (!r) return 'not_found'
  if (r.user_id !== userId) return 'forbidden'
  if (r.status !== 'RENTED') return 'invalid'      // OVERDUE 도 DB상 RENTED 이므로 포함
  await sbUpdate(T.equipmentRentals, { id: `eq.${id}` }, { status: 'RETURNED', returned_at: nowKstFmt() })
  return 'ok'
}

/* ─────────────── 관리자 ─────────────── */

export async function getAllRentals(): Promise<EquipmentRentalRow[]> {
  const rows = await sbSelect<EquipmentRentalRow>(T.equipmentRentals, { order: 'created_at.desc', limit: 200 })
  return rows.map(withOverdue)
}

export async function adminForceReturn(id: number): Promise<'ok' | 'not_found'> {
  const r = await sbSelectOne<EquipmentRentalRow>(T.equipmentRentals, { filters: { id: `eq.${id}` } })
  if (!r) return 'not_found'
  const patch = r.status === 'RENTED'
    ? { status: 'RETURNED', returned_at: nowKstFmt() }
    : { status: 'CANCELLED' }
  await sbUpdate(T.equipmentRentals, { id: `eq.${id}` }, patch)
  return 'ok'
}
