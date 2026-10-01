import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFromFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  const vars = {}
  if (!existsSync(envPath)) return vars
  const raw = readFileSync(envPath, 'utf8')
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/)
    if (m) vars[m[1]] = m[2]
  })
  return vars
}

const fileEnv = loadEnvFromFile()
const url = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const outDir = path.join(process.cwd(), 'supabase', 'backups', '2026-08-06', 'logical')
mkdirSync(outDir, { recursive: true })

const supabase = createClient(url, key)
const tables = [
  'business_profile',
  'client_requests',
  'customer_portals',
  'data_storage',
  'enquiries',
  'finance_payments',
  'post_production',
  'settings',
  'team_members',
  'work_orders',
]

const summary = []
for (const table of tables) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) {
    summary.push({ table, ok: false, error: error.message, count: 0 })
    continue
  }
  writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(data ?? [], null, 2), 'utf8')
  summary.push({ table, ok: true, count: (data ?? []).length })
}

writeFileSync(path.join(outDir, 'public_data_summary.json'), JSON.stringify(summary, null, 2), 'utf8')
console.log(JSON.stringify(summary, null, 2))
