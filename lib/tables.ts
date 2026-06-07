// 한 Supabase DB를 여러 앱이 공유하므로 본 앱의 모든 테이블은 soc_ 접두사를 사용한다.
// ops-dashboard로 이식 시 이 상수값들만 prefix 없는 이름으로 교체하면 된다.
export const T = {
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
  users:               'soc_users',
  auditLog:            'soc_audit_log',
  banners:             'soc_banners',
  equipmentItems:      'soc_equipment_items',
  czSubjects:          'soc_coding_zone_subjects',
  czClasses:           'soc_coding_zone_classes',
  czRegisters:         'soc_coding_zone_registers',
} as const

export type TableName = (typeof T)[keyof typeof T]
