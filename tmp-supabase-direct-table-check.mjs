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
const tables = ['profiles', 'employees', 'user_accounts', 'team_members', 'role_permissions', 'workspaces', 'business_profile', 'customer_portals', 'finance_payments', 'work_orders']
for (const table of tables) {
  try {
    const { data, error, status } = await supabase.from(table).select('id').limit(1)
    if (error) {
      console.log('TABLE', table, 'ERROR', status, error.code || error.message || JSON.stringify(error))
    } else {
      console.log('TABLE', table, 'OK', 'ROWS', data?.length ?? 0, 'SAMPLE', JSON.stringify(data))
    }
  } catch (err) {
    console.log('TABLE', table, 'EXCEPTION', err.message || err)
  }
}

try {
  const { data, error, status } = await supabase.from('auth.users').select('id,email,confirmed_at,created_at').limit(5)
  if (error) {
    console.log('AUTH.USERS', 'ERROR', status, error.code || error.message || JSON.stringify(error))
  } else {
    console.log('AUTH.USERS', 'OK', JSON.stringify(data, null, 2))
  }
} catch (err) {
  console.log('AUTH.USERS', 'EXCEPTION', err.message || err)
}

try {
  const session = supabase.auth.getSession()
  console.log('GET SESSION', session)
} catch (err) {
  console.log('GET SESSION EXCEPTION', err.message || err)
}
