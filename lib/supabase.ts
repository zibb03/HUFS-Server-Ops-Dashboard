const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정')
}

const REST = `${SUPABASE_URL ?? ''}/rest/v1`

function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const key = SUPABASE_KEY ?? ''
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${text || res.statusText}`)
  }
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export interface SelectOptions {
  select?: string
  order?: string         // 예: "created_at.desc"
  limit?: number
  filters?: Record<string, string>  // 예: { id: 'eq.1' }
}

function buildQuery(opts: SelectOptions): string {
  const params = new URLSearchParams()
  params.set('select', opts.select ?? '*')
  if (opts.order) params.set('order', opts.order)
  if (typeof opts.limit === 'number') params.set('limit', String(opts.limit))
  if (opts.filters) {
    for (const [col, expr] of Object.entries(opts.filters)) params.set(col, expr)
  }
  return params.toString()
}

export async function sbSelect<T>(table: string, opts: SelectOptions = {}): Promise<T[]> {
  const url = `${REST}/${table}?${buildQuery(opts)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
    cache: 'no-store',
  })
  return parse<T[]>(res)
}

export async function sbSelectOne<T>(table: string, opts: SelectOptions = {}): Promise<T | null> {
  const rows = await sbSelect<T>(table, { ...opts, limit: 1 })
  return rows[0] ?? null
}

export async function sbInsert<T>(table: string, payload: object): Promise<T> {
  const url = `${REST}/${table}`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const rows = await parse<T[]>(res)
  return rows[0]
}

export async function sbUpdate<T>(
  table: string,
  filters: Record<string, string>,
  payload: object,
): Promise<T[]> {
  const params = new URLSearchParams()
  params.set('select', '*')
  for (const [col, expr] of Object.entries(filters)) params.set(col, expr)
  const url = `${REST}/${table}?${params.toString()}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  return parse<T[]>(res)
}

export async function sbDelete(
  table: string,
  filters: Record<string, string>,
): Promise<number> {
  const params = new URLSearchParams()
  for (const [col, expr] of Object.entries(filters)) params.set(col, expr)
  const url = `${REST}/${table}?${params.toString()}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders({ Prefer: 'return=representation' }),
    cache: 'no-store',
  })
  const rows = await parse<unknown[]>(res)
  return Array.isArray(rows) ? rows.length : 0
}
