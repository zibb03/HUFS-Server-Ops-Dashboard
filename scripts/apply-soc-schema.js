/* eslint-disable */
// Supabase Postgres 에 soc_* 스키마(supabase/schema.sql) 적용.
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}
loadEnv(path.join(__dirname, '..', '.env.local'))

const url = process.env.SUPABASE_DATABASE_URL
if (!url) { console.error('DATABASE_URL 미설정'); process.exit(1) }

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8')

;(async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('✓ connected')
  await client.query(sql)
  console.log('✓ soc_ schema + seed applied')
  const tables = [
    'soc_server_status','soc_security_status','soc_server_load',
    'soc_incidents','soc_notices','soc_network_devices',
    'soc_ip_requests','soc_equipment_requests','soc_printer_requests','soc_maintenance_requests',
  ]
  for (const t of tables) {
    const r = await client.query(`SELECT COUNT(*)::int AS c FROM ${t}`)
    console.log(`  ${t.padEnd(28)} rows=${r.rows[0].c}`)
  }
  await client.end()
})().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
