import { sbSelect, sbSelectOne, sbInsert, sbUpdate } from './supabase'
import type {
  ServerStatusRow, SecurityStatusRow, ServerLoadRow,
  IncidentRow, NoticeRow, DashboardData,
  IPRequestPayload, EquipmentRequestPayload,
  PrinterRequestPayload, MaintenanceRequestPayload,
  IPRequestRow, EquipmentRequestRow, PrinterRequestRow, MaintenanceRequestRow,
  NetworkDeviceRow,
} from './types'

// 한 Supabase DB 를 여러 앱이 공유하므로 본 앱의 모든 테이블은 soc_ 접두사를 사용한다.
const T = {
  serverStatus:        'soc_server_status',
  securityStatus:      'soc_security_status',
  serverLoad:          'soc_server_load',
  incidents:           'soc_incidents',
  notices:             'soc_notices',
  ipRequests:          'soc_ip_requests',
  equipmentRequests:   'soc_equipment_requests',
  printerRequests:     'soc_printer_requests',
  maintenanceRequests: 'soc_maintenance_requests',
  networkDevices:      'soc_network_devices',
} as const

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

export async function insertNotice(title: string, type = 'general'): Promise<NoticeRow> {
  return sbInsert<NoticeRow>(T.notices, { title, type })
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
