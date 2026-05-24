// CSV 내보내기 헬퍼 — 브라우저에서 Blob 생성 후 다운로드.
// Excel에서 한글이 깨지지 않도록 UTF-8 BOM 포함.

export interface CsvColumn<T> {
  key: keyof T | string
  label: string
  map?: (row: T) => unknown
}

// 모든 값을 큰따옴표로 감싸고, 날짜 형식(YYYY-MM-DD ...)은 추가로 TAB prefix를 붙여
// Excel이 자동으로 날짜·시간으로 변환(예: "04:02" → "4:02")하지 못하게 강제 텍스트화.
function escape(value: unknown): string {
  if (value === null || value === undefined) return '""'
  let s = String(value)
  // 날짜처럼 보이는 값(YYYY-MM-DD 또는 YYYY-MM-DD HH:MM) → TAB prefix
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) s = '\t' + s
  s = s.replace(/"/g, '""')
  return `"${s}"`
}

// 로컬(KST 등) 기준 오늘 날짜를 YYYY-MM-DD로 반환.
// toISOString()은 UTC라 한국 새벽 시간엔 어제 날짜가 찍히는 문제 회피.
export function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const header = columns.map(c => escape(c.label)).join(',')
  const body = rows
    .map(r => columns.map(c => escape(c.map ? c.map(r) : (r as Record<string, unknown>)[c.key as string])).join(','))
    .join('\r\n')
  const csv = '﻿' + header + '\r\n' + body
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
