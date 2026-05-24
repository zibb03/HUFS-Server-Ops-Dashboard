import { sbSelect, sbSelectOne, sbInsert, sbUpdate, sbDelete } from './supabase'
import { T } from './tables'
import type {
  ServerStatusRow, SecurityStatusRow, ServerLoadRow,
  IncidentRow, NoticeRow, DashboardData,
  IPRequestPayload, EquipmentRequestPayload,
  PrinterRequestPayload, MaintenanceRequestPayload,
  IPRequestRow, EquipmentRequestRow, PrinterRequestRow, MaintenanceRequestRow,
  NetworkDeviceRow, NetworkDevicePayload,
  BannerRow, BannerPayload,
  EquipmentItemRow,
} from './types'

/* ─── GET ─── */

export async function getServerStatus(): Promise<ServerStatusRow> {
  const row = await sbSelectOne<ServerStatusRow>(T.serverStatus, { filters: { id: 'eq.1' } })
  if (!row) throw new Error(`${T.serverStatus} 행이 없습니다`)
  return row
}

export async function getSecurityStatus(): Promise<SecurityStatusRow> {
  const row = await sbSelectOne<SecurityStatusRow>(T.securityStatus, { filters: { id: 'eq.1' } })
  if (!row) throw new Error(`${T.securityStatus} 행이 없습니다`)
  return row
}

export async function getServerLoad(): Promise<ServerLoadRow> {
  const row = await sbSelectOne<ServerLoadRow>(T.serverLoad, { filters: { id: 'eq.1' } })
  if (!row) throw new Error(`${T.serverLoad} 행이 없습니다`)
  return row
}

export async function getIncidents(limit = 10): Promise<IncidentRow[]> {
  return sbSelect<IncidentRow>(T.incidents, { order: 'created_at.desc', limit })
}

// 관리자용: 비공개 포함 전체
export async function getNotices(limit = 10): Promise<NoticeRow[]> {
  return sbSelect<NoticeRow>(T.notices, { order: 'created_at.desc', limit })
}

// 일반 사용자용: 공개(is_public=true) 공지만
export async function getPublicNotices(limit = 10): Promise<NoticeRow[]> {
  return sbSelect<NoticeRow>(T.notices, {
    order: 'created_at.desc',
    limit,
    filters: { is_public: 'eq.true' },
  })
}

export async function getNoticeById(id: number): Promise<NoticeRow | null> {
  return sbSelectOne<NoticeRow>(T.notices, { filters: { id: `eq.${id}` } })
}

export async function getDashboardData(): Promise<DashboardData> {
  const [serverStatus, securityStatus, serverLoad, incidents, notices] = await Promise.all([
    getServerStatus(),
    getSecurityStatus(),
    getServerLoad(),
    getIncidents(4),
    getPublicNotices(4),
  ])
  return { serverStatus, securityStatus, serverLoad, incidents, notices }
}

/* ─── INSERT ─── */

export async function insertIncident(payload: { title: string; status?: string; body?: string | null }): Promise<IncidentRow> {
  return sbInsert<IncidentRow>(T.incidents, {
    title: payload.title,
    status: payload.status ?? 'processing',
    body: payload.body ?? null,
  })
}

export async function updateIncident(id: number, patch: { title?: string; status?: string; body?: string | null }): Promise<number> {
  const rows = await sbUpdate<IncidentRow>(T.incidents, { id: `eq.${id}` }, patch)
  return rows.length
}

export async function deleteIncident(id: number): Promise<number> {
  return sbDelete(T.incidents, { id: `eq.${id}` })
}

export async function insertNotice(payload: { title: string; type?: string; body?: string | null; is_public?: boolean }): Promise<NoticeRow> {
  return sbInsert<NoticeRow>(T.notices, {
    title: payload.title,
    type: payload.type ?? 'general',
    body: payload.body ?? null,
    is_public: payload.is_public ?? true,
  })
}

export async function updateNotice(id: number, patch: { title?: string; type?: string; body?: string | null; is_public?: boolean }): Promise<number> {
  const rows = await sbUpdate<NoticeRow>(T.notices, { id: `eq.${id}` }, patch)
  return rows.length
}

export async function deleteNotice(id: number): Promise<number> {
  return sbDelete(T.notices, { id: `eq.${id}` })
}

export async function insertIPRequest(payload: IPRequestPayload, userId: number | null = null): Promise<IPRequestRow> {
  return sbInsert<IPRequestRow>(T.ipRequests, { ...payload, user_id: userId })
}

export async function insertEquipmentRequest(payload: EquipmentRequestPayload, userId: number | null = null): Promise<EquipmentRequestRow> {
  return sbInsert<EquipmentRequestRow>(T.equipmentRequests, { ...payload, user_id: userId })
}

export async function insertPrinterRequest(payload: PrinterRequestPayload, userId: number | null = null): Promise<PrinterRequestRow> {
  return sbInsert<PrinterRequestRow>(T.printerRequests, { ...payload, user_id: userId })
}

export async function insertMaintenanceRequest(payload: MaintenanceRequestPayload, userId: number | null = null): Promise<MaintenanceRequestRow> {
  return sbInsert<MaintenanceRequestRow>(T.maintenanceRequests, { ...payload, user_id: userId })
}

/* ─── List queries ─── */

// userId가 지정되면 본인 신청만, 아니면 전체
function userFilter(userId?: number) {
  return userId !== undefined ? { filters: { user_id: `eq.${userId}` } } : {}
}

export async function getIPRequests(opts: { userId?: number } = {}): Promise<IPRequestRow[]> {
  return sbSelect<IPRequestRow>(T.ipRequests, { order: 'created_at.desc', ...userFilter(opts.userId) })
}

export async function getEquipmentRequests(opts: { userId?: number } = {}): Promise<EquipmentRequestRow[]> {
  return sbSelect<EquipmentRequestRow>(T.equipmentRequests, { order: 'created_at.desc', ...userFilter(opts.userId) })
}

export async function getEquipmentRequestById(id: number): Promise<EquipmentRequestRow | null> {
  return sbSelectOne<EquipmentRequestRow>(T.equipmentRequests, { filters: { id: `eq.${id}` } })
}

export async function getPrinterRequests(opts: { userId?: number } = {}): Promise<PrinterRequestRow[]> {
  return sbSelect<PrinterRequestRow>(T.printerRequests, { order: 'created_at.desc', ...userFilter(opts.userId) })
}

export async function getMaintenanceRequests(opts: { userId?: number } = {}): Promise<MaintenanceRequestRow[]> {
  return sbSelect<MaintenanceRequestRow>(T.maintenanceRequests, { order: 'created_at.desc', ...userFilter(opts.userId) })
}

export async function getNetworkDevices(): Promise<NetworkDeviceRow[]> {
  return sbSelect<NetworkDeviceRow>(T.networkDevices, { order: 'hostname.asc' })
}

export async function insertNetworkDevice(payload: NetworkDevicePayload): Promise<NetworkDeviceRow> {
  return sbInsert<NetworkDeviceRow>(T.networkDevices, {
    hostname: payload.hostname,
    ip_address: payload.ip_address,
    mac_address: payload.mac_address,
    device_type: payload.device_type,
    status: payload.status ?? 'online',
  })
}

export async function updateNetworkDevice(id: number, patch: Partial<NetworkDevicePayload>): Promise<number> {
  const rows = await sbUpdate<NetworkDeviceRow>(T.networkDevices, { id: `eq.${id}` }, patch)
  return rows.length
}

export async function deleteNetworkDevice(id: number): Promise<number> {
  return sbDelete(T.networkDevices, { id: `eq.${id}` })
}

/* ─── Banners ─── */

export async function getBanners(): Promise<BannerRow[]> {
  return sbSelect<BannerRow>(T.banners, { order: 'sort_order.asc' })
}

export async function getActiveBanners(): Promise<BannerRow[]> {
  return sbSelect<BannerRow>(T.banners, { order: 'sort_order.asc', filters: { active: 'eq.true' } })
}

export async function insertBanner(payload: BannerPayload): Promise<BannerRow> {
  return sbInsert<BannerRow>(T.banners, {
    text: payload.text,
    sort_order: payload.sort_order ?? 0,
    active: payload.active ?? true,
  })
}

export async function updateBanner(id: number, patch: Partial<BannerPayload>): Promise<number> {
  const rows = await sbUpdate<BannerRow>(T.banners, { id: `eq.${id}` }, patch)
  return rows.length
}

export async function deleteBanner(id: number): Promise<number> {
  return sbDelete(T.banners, { id: `eq.${id}` })
}

/* ─── Equipment items (대여 장비 카탈로그) ─── */

export async function getEquipmentItems(): Promise<EquipmentItemRow[]> {
  return sbSelect<EquipmentItemRow>(T.equipmentItems, { order: 'name.asc' })
}

export async function getAvailableEquipmentItems(): Promise<EquipmentItemRow[]> {
  return sbSelect<EquipmentItemRow>(T.equipmentItems, {
    order: 'name.asc',
    filters: { available_qty: 'gt.0' },
  })
}

export async function getEquipmentItemByName(name: string): Promise<EquipmentItemRow | null> {
  return sbSelectOne<EquipmentItemRow>(T.equipmentItems, { filters: { name: `eq.${name}` } })
}

export async function getEquipmentItemById(id: number): Promise<EquipmentItemRow | null> {
  return sbSelectOne<EquipmentItemRow>(T.equipmentItems, { filters: { id: `eq.${id}` } })
}

export async function insertEquipmentItem(payload: { name: string; total_qty: number }): Promise<EquipmentItemRow> {
  return sbInsert<EquipmentItemRow>(T.equipmentItems, {
    name: payload.name,
    total_qty: payload.total_qty,
    available_qty: payload.total_qty,
  })
}

export async function updateEquipmentItem(
  id: number,
  patch: { name?: string; total_qty?: number; available_qty?: number },
): Promise<number> {
  const rows = await sbUpdate<EquipmentItemRow>(T.equipmentItems, { id: `eq.${id}` }, patch)
  return rows.length
}

export async function deleteEquipmentItem(id: number): Promise<number> {
  return sbDelete(T.equipmentItems, { id: `eq.${id}` })
}

// 재고 증감: delta 만큼 available_qty 조정 (0 ~ total_qty 범위로 클램프).
// 대여 승인 시 -1, 반납/거절 시 +1.
export async function adjustEquipmentStock(name: string, delta: number): Promise<void> {
  const item = await getEquipmentItemByName(name)
  if (!item) return  // 카탈로그에 없는 장비명(예: 기타)은 재고 관리 대상 아님
  const next = Math.max(0, Math.min(item.total_qty, item.available_qty + delta))
  if (next === item.available_qty) return
  await sbUpdate<EquipmentItemRow>(T.equipmentItems, { id: `eq.${item.id}` }, { available_qty: next })
}

/* ─── Status updates ─── */

// rejectReason이 undefined면 reject_reason 컬럼은 손대지 않음.
// null 또는 string이면 그 값으로 set (반려 시 string, 다른 상태로 전환 시 null로 비움).
async function updateStatus(
  table: string,
  id: number,
  status: string,
  rejectReason?: string | null,
): Promise<number> {
  const patch: { status: string; reject_reason?: string | null } = { status }
  if (rejectReason !== undefined) patch.reject_reason = rejectReason
  const rows = await sbUpdate<{ id: number }>(table, { id: `eq.${id}` }, patch)
  return rows.length
}

export function updateIPRequestStatus(id: number, status: string, rejectReason?: string | null) {
  return updateStatus(T.ipRequests, id, status, rejectReason)
}

export function updateEquipmentRequestStatus(id: number, status: string, rejectReason?: string | null) {
  return updateStatus(T.equipmentRequests, id, status, rejectReason)
}

export function updatePrinterRequestStatus(id: number, status: string, rejectReason?: string | null) {
  return updateStatus(T.printerRequests, id, status, rejectReason)
}

export function updateMaintenanceRequestStatus(id: number, status: string, rejectReason?: string | null) {
  return updateStatus(T.maintenanceRequests, id, status, rejectReason)
}
