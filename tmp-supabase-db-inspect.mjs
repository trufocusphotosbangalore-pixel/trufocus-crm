import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
const envPath = path.join(process.cwd(), '.env.local')
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const vars = {}
env.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/)
  if (m) vars[m[1]] = m[2]
})
if (!vars.VITE_SUPABASE_URL || !vars.VITE_SUPABASE_ANON_KEY) {
  console.error('No supabase env found.')
  process.exit(1)
}
const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY)
const tablesToCheck = ['profiles', 'employees', 'user_accounts', 'team_members', 'role_permissions', 'workspaces', 'business_profile', 'customer_portals', 'finance_payments', 'work_orders']
const existingTables = []
for (const table of tablesToCheck) {
  try {
    const { data, error } = await supabase.from('information_schema.tables').select('table_name,table_schema').eq('table_name', table)
    if (error) {
      console.log('TABLE CHECK ERROR', table, error.message)
      continue
    }
    if (data && data.length > 0) {
      existingTables.push(table)
    }
  } catch (e) {
    console.log('EXCEPTION', table, e.message || e)
  }
}
console.log('existing tables:', existingTables)

for (const table of tablesToCheck) {
  if (!existingTables.includes(table)) continue
  try {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    console.log('rowcount sample for', table, 'error', error ? JSON.stringify(error) : 'OK', 'sample', data)
  } catch (e) {
    console.log('rowcount sample exception', table, e.message || e)
  }
}

// Try listing auth users if possible
try {
  const { data, error } = await supabase.from('auth.users').select('id,email,confirmed_at,created_at').limit(20)
  console.log('auth.users query result', error ? JSON.stringify(error) : 'OK', JSON.stringify(data, null, 2))
} catch (e) {
  console.log('auth.users query exception', e.message || e)
}
