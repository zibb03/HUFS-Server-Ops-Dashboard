/* eslint-disable */
// .env.local 의 TODO_APP_DATABASE_URL 로 접속하여 supabase/todo_app_schema.sql 실행
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}
loadEnv(path.join(__dirname, '..', '.env.local'))

const url = process.env.TODO_APP_DATABASE_URL
if (!url) {
  console.error('TODO_APP_DATABASE_URL 미설정')
  process.exit(1)
}

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'todo_app_schema.sql'), 'utf8')

;(async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    console.log('✓ connected')
    await client.query(sql)
    console.log('✓ schema + seed applied')

    const tables = ['todo_app_users', 'todo_app_lists', 'todo_app_todos', 'todo_app_tags', 'todo_app_todo_tags']
    for (const t of tables) {
      const r = await client.query(`SELECT COUNT(*)::int AS c FROM ${t}`)
      console.log(`  ${t.padEnd(22)} rows=${r.rows[0].c}`)
    }
  } catch (e) {
    console.error('ERROR:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
})()
