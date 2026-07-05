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

/* ─────────────── 코딩존 (AdvICE 이식, 시연용) ─────────────── */

export interface CodingZoneSubject {
  id: number
  name: string
  created_at: string
}

export interface CodingZoneClassRow {
  id: number
  subject_id: number
  class_name: string
  assistant_name: string
  class_date: string        // "YYYY-MM-DD"
  class_time: string        // "14:00"
  week_day: string | null
  maximum_number: number
  current_number: number
  created_at: string
}

export interface CodingZoneClassWithMine extends CodingZoneClassRow {
  reserved_by_me: boolean
}

export interface CodingZoneRegisterRow {
  id: number
  class_id: number
  user_id: number | null
  user_email: string
  user_name: string
  user_student_num: string | null
  attended: boolean
  created_at: string
}

export interface CodingZoneMyReservation extends CodingZoneRegisterRow {
  class_name: string
  assistant_name: string
  class_date: string
  class_time: string
  subject_id: number
}

export interface CodingZoneClassPayload {
  subject_id: number
  class_name: string
  assistant_name: string
  class_date: string
  class_time: string
  week_day?: string
  maximum_number: number
}

export type CzReserveResult = 'ok' | 'full' | 'duplicate' | 'not_found'

/* ─────────────── 스터디룸 예약 (ICE 스터디룸 이식, 시연용) ─────────────── */

export type StudyRoomType = 'GROUP' | 'INDIVIDUAL'
export type StudyReservationStatus =
  | 'RESERVED' | 'ENTRANCE' | 'LATE' | 'NO_SHOW' | 'COMPLETED' | 'CANCELLED'
export type StudyPenaltyReason = 'CANCEL' | 'LATE' | 'NO_SHOW' | 'ADMIN'

export interface StudyRoomRow {
  id: number
  room_number: string
  room_type: StudyRoomType
  capacity: number
  min_participants: number
  location: string | null
  facilities: string | null   // 쉼표구분 "PC,화이트보드"
  open_time: string
  close_time: string
  is_active: boolean
  created_at: string
}

export interface StudyReservationRow {
  id: number
  group_id: string | null
  room_number: string
  room_type: StudyRoomType
  schedule_date: string
  start_time: string
  end_time: string
  user_id: number | null
  user_email: string
  user_name: string
  user_student_num: string | null
  is_holder: boolean
  status: StudyReservationStatus
  enter_time: string | null
  qr_token: string | null
  created_at: string
}

export interface StudyReservationGroup extends StudyReservationRow {
  participants: { name: string; email: string; status: StudyReservationStatus }[]
}

export interface StudyPenaltyRow {
  id: number
  user_id: number | null
  reservation_id: number | null
  reason: StudyPenaltyReason
  penalty_end: string
  status: 'VALID' | 'EXPIRED'
  created_at: string
}

export interface StudySlot {
  start_time: string
  end_time: string
  current: number
  capacity: number
  available: boolean
}

export interface StudyRoomPayload {
  room_number: string
  room_type: StudyRoomType
  capacity: number
  min_participants?: number
  location?: string
  facilities?: string
  open_time?: string
  close_time?: string
}

export type StudyReserveResult =
  | 'ok' | 'full' | 'duplicate' | 'not_found' | 'penalty'
  | 'invalid_participants' | 'past' | 'closed'
export type StudyCheckInResult =
  | 'ENTRANCE' | 'LATE' | 'NO_SHOW' | 'too_early' | 'not_found' | 'already'
export type StudyCancelResult = 'ok' | 'penalty' | 'too_late' | 'not_found' | 'forbidden'
export type StudyExtendResult = 'ok' | 'no_slot' | 'full' | 'not_entered' | 'not_found'
