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

export type IncidentStatus = 'processing' | 'done'

export interface IncidentRow {
  id: number
  title: string
  body: string | null
  status: IncidentStatus
  created_at: string
}

export interface NoticeRow {
  id: number
  title: string
  body: string | null
  type: 'notice' | 'info' | 'general'
  is_public: boolean
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
interface BaseRequestRow {
  id: number
  status: RequestStatus
  created_at: string
  user_id: number | null
  reject_reason: string | null
}

export interface IPRequestRow extends IPRequestPayload, BaseRequestRow {}
export interface EquipmentRequestRow extends EquipmentRequestPayload, BaseRequestRow {}
export interface PrinterRequestRow extends PrinterRequestPayload, BaseRequestRow {}
export interface MaintenanceRequestRow extends MaintenanceRequestPayload, BaseRequestRow {}

export interface EquipmentItemRow {
  id: number
  name: string
  total_qty: number
  available_qty: number
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

export type DeviceStatus = 'online' | 'offline' | 'warning'

export interface NetworkDeviceRow {
  id: number
  hostname: string
  ip_address: string
  mac_address: string
  device_type: string
  status: DeviceStatus
  last_seen: string
}

export interface NetworkDevicePayload {
  hostname: string
  ip_address: string
  mac_address: string
  device_type: string
  status?: DeviceStatus
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
