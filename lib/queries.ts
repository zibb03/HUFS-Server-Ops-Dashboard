import { getDb } from './db'
import type {
  ServerStatusRow, SecurityStatusRow, ServerLoadRow,
  IncidentRow, NoticeRow, DashboardData,
  IPRequestPayload, EquipmentRequestPayload,
  PrinterRequestPayload, MaintenanceRequestPayload,
  IPRequestRow, EquipmentRequestRow, PrinterRequestRow, MaintenanceRequestRow,
  NetworkDeviceRow,
} from './types'

/* ─── GET ─── */

export function getServerStatus(): ServerStatusRow {
  return getDb().prepare('SELECT * FROM server_status WHERE id = 1').get() as ServerStatusRow
}

export function getSecurityStatus(): SecurityStatusRow {
  return getDb().prepare('SELECT * FROM security_status WHERE id = 1').get() as SecurityStatusRow
}

export function getServerLoad(): ServerLoadRow {
  return getDb().prepare('SELECT * FROM server_load WHERE id = 1').get() as ServerLoadRow
}

export function getIncidents(limit = 10): IncidentRow[] {
  return getDb()
    .prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT ?')
    .all(limit) as IncidentRow[]
}

export function getNotices(limit = 10): NoticeRow[] {
  return getDb()
    .prepare('SELECT * FROM notices ORDER BY created_at DESC LIMIT ?')
    .all(limit) as NoticeRow[]
}

export function getDashboardData(): DashboardData {
  return {
    serverStatus:   getServerStatus(),
    securityStatus: getSecurityStatus(),
    serverLoad:     getServerLoad(),
    incidents:      getIncidents(4),
    notices:        getNotices(4),
  }
}

/* ─── INSERT ─── */

export function insertIPRequest(payload: IPRequestPayload) {
  return getDb()
    .prepare('INSERT INTO ip_requests (applicant_name, department, student_id, purpose) VALUES (?, ?, ?, ?)')
    .run(payload.applicant_name, payload.department, payload.student_id, payload.purpose)
}

export function insertEquipmentRequest(payload: EquipmentRequestPayload) {
  return getDb()
    .prepare('INSERT INTO equipment_requests (applicant_name, equipment_type, rental_start, rental_end) VALUES (?, ?, ?, ?)')
    .run(payload.applicant_name, payload.equipment_type, payload.rental_start, payload.rental_end)
}

export function insertPrinterRequest(payload: PrinterRequestPayload) {
  return getDb()
    .prepare('INSERT INTO printer_requests (applicant_name, printer_id, copies) VALUES (?, ?, ?)')
    .run(payload.applicant_name, payload.printer_id, payload.copies)
}

export function insertMaintenanceRequest(payload: MaintenanceRequestPayload) {
  return getDb()
    .prepare('INSERT INTO maintenance_requests (applicant_name, equipment_desc, issue_detail, urgency) VALUES (?, ?, ?, ?)')
    .run(payload.applicant_name, payload.equipment_desc, payload.issue_detail, payload.urgency)
}

/* ─── List queries ─── */

export function getIPRequests(): IPRequestRow[] {
  return getDb().prepare('SELECT * FROM ip_requests ORDER BY created_at DESC').all() as IPRequestRow[]
}

export function getEquipmentRequests(): EquipmentRequestRow[] {
  return getDb().prepare('SELECT * FROM equipment_requests ORDER BY created_at DESC').all() as EquipmentRequestRow[]
}

export function getPrinterRequests(): PrinterRequestRow[] {
  return getDb().prepare('SELECT * FROM printer_requests ORDER BY created_at DESC').all() as PrinterRequestRow[]
}

export function getMaintenanceRequests(): MaintenanceRequestRow[] {
  return getDb().prepare('SELECT * FROM maintenance_requests ORDER BY created_at DESC').all() as MaintenanceRequestRow[]
}

export function getNetworkDevices(): NetworkDeviceRow[] {
  return getDb().prepare('SELECT * FROM network_devices ORDER BY hostname').all() as NetworkDeviceRow[]
}

/* ─── Status updates ─── */

export function updateIPRequestStatus(id: number, status: string) {
  return getDb().prepare('UPDATE ip_requests SET status = ? WHERE id = ?').run(status, id)
}

export function updateEquipmentRequestStatus(id: number, status: string) {
  return getDb().prepare('UPDATE equipment_requests SET status = ? WHERE id = ?').run(status, id)
}

export function updatePrinterRequestStatus(id: number, status: string) {
  return getDb().prepare('UPDATE printer_requests SET status = ? WHERE id = ?').run(status, id)
}

export function updateMaintenanceRequestStatus(id: number, status: string) {
  return getDb().prepare('UPDATE maintenance_requests SET status = ? WHERE id = ?').run(status, id)
}
