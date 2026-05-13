/* eslint-disable */
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

;(async () => {
  const client = new Client({ connectionString: process.env.TODO_APP_DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const tables = await client.query(`
      SELECT table_name
        FROM information_schema.tables
       WHERE table_schema='public' AND table_name LIKE 'todo_app_%'
       ORDER BY table_name
    `)
    console.log('Tables:')
    for (const r of tables.rows) console.log('  -', r.table_name)

    console.log('\nUsers:')
    const u = await client.query('SELECT id, email, name FROM todo_app_users ORDER BY id')
    for (const r of u.rows) console.log(' ', r)

    console.log('\nTop 5 Todos with list and user:')
    const t = await client.query(`
      SELECT td.id, td.title, td.priority, td.is_done, td.due_date,
             ls.title AS list, us.name AS user
        FROM todo_app_todos td
        JOIN todo_app_lists ls ON ls.id = td.list_id
        JOIN todo_app_users us ON us.id = ls.user_id
       ORDER BY td.id LIMIT 5
    `)
    for (const r of t.rows) console.log(' ', r)

    console.log('\nTag counts per user:')
    const tg = await client.query(`
      SELECT us.name AS user, COUNT(*)::int AS tags
        FROM todo_app_tags tg JOIN todo_app_users us ON us.id = tg.user_id
       GROUP BY us.name ORDER BY us.name
    `)
    for (const r of tg.rows) console.log(' ', r)
  } finally {
    await client.end()
  }
})().catch(e => { console.error(e); process.exit(1) })
