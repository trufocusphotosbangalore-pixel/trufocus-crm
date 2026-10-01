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
for (const table of ['user_accounts', 'team_members', 'profiles']) {
  try {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    console.log('TABLE', table, 'error', error ? JSON.stringify(error) : 'OK', 'data', data)
  } catch (e) {
    console.log('TABLE', table, 'exception', e.message || e)
  }
}
