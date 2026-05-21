export type UserRole = 'admin' | 'manager' | 'member'

export interface SessionUser {
  id: number
  email: string
  name: string
  department: string
  student_id: string
  role: UserRole
}

export interface ServerStatusRow {
  id: number
  temperature: number
  humidity: number
  max_temp: number
  min_temp: number
  fire_detected: number  // 0 | 1
  overall_status: string
  uptime_percent: number
  updated_at: string
}

export interface SecurityStatusRow {
  id: number
  threat_level: number      // 0-100
  national_threat_level: number
  updated_at: string
}

export interface ServerLoadRow {
  id: number
  web_server: number
  db_server: number
  network: number
  storage: number
  updated_at: string
}

export interface IncidentRow {
  id: number
  title: string
  status: 'processing' | 'done'
  created_at: string
}

export interface NoticeRow {
  id: number
  title: string
  body: string | null
  type: 'notice' | 'info' | 'general'
  created_at: string
}

export interface DashboardData {
  serverStatus: ServerStatusRow
  securityStatus: SecurityStatusRow
  serverLoad: ServerLoadRow
  incidents: IncidentRow[]
  notices: NoticeRow[]
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'

/* ── Request rows (DB) ── */
export interface IPRequestRow extends IPRequestPayload {
  id: number
  status: RequestStatus
  created_at: string
}

export interface EquipmentRequestRow extends EquipmentRequestPayload {
  id: number
  status: RequestStatus
  created_at: string
}

export interface PrinterRequestRow extends PrinterRequestPayload {
  id: number
  status: RequestStatus
  created_at: string
}

export interface MaintenanceRequestRow extends MaintenanceRequestPayload {
  id: number
  status: RequestStatus
  created_at: string
}

export interface BannerRow {
  id: number
  text: string
  sort_order: number
  active: boolean
  created_at: string
}

export interface BannerPayload {
  text: string
  sort_order?: number
  active?: boolean
}

export interface NetworkDeviceRow {
  id: number
  hostname: string
  ip_address: string
  mac_address: string
  device_type: string
  status: 'online' | 'offline' | 'warning'
  last_seen: string
}

/* ── Request payloads ── */
export interface IPRequestPayload {
  applicant_name: string
  department: string
  student_id: string
  purpose: string
}

export interface EquipmentRequestPayload {
  applicant_name: string
  equipment_type: string
  rental_start: string
  rental_end: string
}

export interface PrinterRequestPayload {
  applicant_name: string
  printer_id: string
  copies: number
}

export interface MaintenanceRequestPayload {
  applicant_name: string
  equipment_desc: string
  issue_detail: string
  urgency: string
}
