import { sbSelect, sbSelectOne, sbInsert, sbUpdate, sbDelete } from './supabase'
import { T } from './tables'
import type {
  ServerStatusRow, SecurityStatusRow, ServerLoadRow,
  IncidentRow, NoticeRow, DashboardData,
  IPRequestPayload, EquipmentRequestPayload,
  PrinterRequestPayload, MaintenanceRequestPayload,
  IPRequestRow, EquipmentRequestRow, PrinterRequestRow, MaintenanceRequestRow,
  NetworkDeviceRow,
  BannerRow, BannerPayload,
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

export async function getNotices(limit = 10): Promise<NoticeRow[]> {
  return sbSelect<NoticeRow>(T.notices, { order: 'created_at.desc', limit })
}

export async function getDashboardData(): Promise<DashboardData> {
  const [serverStatus, securityStatus, serverLoad, incidents, notices] = await Promise.all([
    getServerStatus(),
    getSecurityStatus(),
    getServerLoad(),
    getIncidents(4),
    getNotices(4),
  ])
  return { serverStatus, securityStatus, serverLoad, incidents, notices }
}

/* ─── INSERT ─── */

export async function insertIncident(title: string, status = 'processing'): Promise<IncidentRow> {
  return sbInsert<IncidentRow>(T.incidents, { title, status })
}

export async function insertNotice(payload: { title: string; type?: string; body?: string | null }): Promise<NoticeRow> {
  return sbInsert<NoticeRow>(T.notices, {
    title: payload.title,
    type: payload.type ?? 'general',
    body: payload.body ?? null,
  })
}

export async function updateNotice(id: number, patch: { title?: string; type?: string; body?: string | null }): Promise<number> {
  const rows = await sbUpdate<NoticeRow>(T.notices, { id: `eq.${id}` }, patch)
  return rows.length
}

export async function deleteNotice(id: number): Promise<number> {
  return sbDelete(T.notices, { id: `eq.${id}` })
}

export async function insertIPRequest(payload: IPRequestPayload): Promise<IPRequestRow> {
  return sbInsert<IPRequestRow>(T.ipRequests, payload)
}

export async function insertEquipmentRequest(payload: EquipmentRequestPayload): Promise<EquipmentRequestRow> {
  return sbInsert<EquipmentRequestRow>(T.equipmentRequests, payload)
}

export async function insertPrinterRequest(payload: PrinterRequestPayload): Promise<PrinterRequestRow> {
  return sbInsert<PrinterRequestRow>(T.printerRequests, payload)
}

export async function insertMaintenanceRequest(payload: MaintenanceRequestPayload): Promise<MaintenanceRequestRow> {
  return sbInsert<MaintenanceRequestRow>(T.maintenanceRequests, payload)
}

/* ─── List queries ─── */

export async function getIPRequests(): Promise<IPRequestRow[]> {
  return sbSelect<IPRequestRow>(T.ipRequests, { order: 'created_at.desc' })
}

export async function getEquipmentRequests(): Promise<EquipmentRequestRow[]> {
  return sbSelect<EquipmentRequestRow>(T.equipmentRequests, { order: 'created_at.desc' })
}

export async function getPrinterRequests(): Promise<PrinterRequestRow[]> {
  return sbSelect<PrinterRequestRow>(T.printerRequests, { order: 'created_at.desc' })
}

export async function getMaintenanceRequests(): Promise<MaintenanceRequestRow[]> {
  return sbSelect<MaintenanceRequestRow>(T.maintenanceRequests, { order: 'created_at.desc' })
}

export async function getNetworkDevices(): Promise<NetworkDeviceRow[]> {
  return sbSelect<NetworkDeviceRow>(T.networkDevices, { order: 'hostname.asc' })
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

/* ─── Status updates ─── */

async function updateStatus(table: string, id: number, status: string): Promise<number> {
  const rows = await sbUpdate<{ id: number }>(table, { id: `eq.${id}` }, { status })
  return rows.length
}

export function updateIPRequestStatus(id: number, status: string) {
  return updateStatus(T.ipRequests, id, status)
}

export function updateEquipmentRequestStatus(id: number, status: string) {
  return updateStatus(T.equipmentRequests, id, status)
}

export function updatePrinterRequestStatus(id: number, status: string) {
  return updateStatus(T.printerRequests, id, status)
}

export function updateMaintenanceRequestStatus(id: number, status: string) {
  return updateStatus(T.maintenanceRequests, id, status)
}
