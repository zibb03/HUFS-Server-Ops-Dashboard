/* eslint-disable */
// .env.local 의 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를
// Vercel 의 production/preview/development 3환경에 stdin 으로 등록.
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

function loadEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[m[1]] = v
  }
  return out
}
const env = loadEnv(path.join(__dirname, '..', '.env.local'))

const VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
// preview 는 CLI 가 git-branch 를 요구하므로 일단 production/development 만.
// (preview 환경 변수는 Vercel Dashboard 에서 추가)
const ENVS = ['production', 'development']

for (const name of VARS) {
  const val = env[name]
  if (!val) { console.error(`! ${name} 미설정 in .env.local`); process.exit(1) }
  for (const e of ENVS) {
    // 기존 값 제거 시도 (없으면 무시)
    spawnSync('vercel', ['env', 'rm', name, e, '--yes'], { stdio: 'ignore', shell: true })
    const r = spawnSync('vercel', ['env', 'add', name, e, '--value', val, '--yes'], { shell: true, encoding: 'utf8' })
    const ok = r.status === 0
    console.log(`${ok ? '✓' : '✗'} ${name.padEnd(28)} [${e}]`)
    if (!ok) { console.error(r.stdout || ''); console.error(r.stderr || ''); process.exit(1) }
  }
}
console.log('\nDone.')
