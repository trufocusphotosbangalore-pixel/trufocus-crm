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
const tables = [
  'profiles',
  'employees',
  'role_permissions',
  'workspaces',
  'work_orders',
  'assignments',
  'deliverables',
  'customer_requests',
  'notifications',
  'audit_logs',
  'user_accounts',
  'team_members',
  'business_profile',
  'customer_portals',
  'finance_payments',
  'data_storage',
  'settings',
  'client_requests',
  'enquiries',
  'post_production'
]

for (const table of tables) {
  try {
    const { data, error, status } = await supabase.from(table).select('id').limit(1)
    if (error) {
      console.log('TABLE', table, 'ERROR', status, error.code || error.message || JSON.stringify(error))
    } else {
      console.log('TABLE', table, 'OK', 'ROWS_SAMPLE', data?.length ?? 0)
    }
  } catch (err) {
    console.log('TABLE', table, 'EXCEPTION', err.message || err)
  }
}

const authAttempts = [
  { email: 'owner@trufocusphotos.com', password: 'Password@123' },
  { email: 'suresh@gmail.com', password: 'Password@123' }
]
for (const attempt of authAttempts) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: attempt.email, password: attempt.password })
    console.log('AUTH_SIGNIN', attempt.email, error ? JSON.stringify({ code: error.code, message: error.message }) : 'OK', data?.user ? { id: data.user.id, email: data.user.email } : null)
  } catch (err) {
    console.log('AUTH_SIGNIN_EXCEPTION', attempt.email, err.message || err)
  }
}
