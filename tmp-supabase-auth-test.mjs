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
for (const attempt of [
  { email: 'owner@trufocusphotos.com', password: 'Password@123' },
  { email: 'suresh@gmail.com', password: 'Password@123' },
  { email: 'trufocus.admin', password: 'admin123' },
]) {
  try {
    console.log('Attempt sign in:', attempt)
    const { data, error } = await supabase.auth.signInWithPassword({ email: attempt.email, password: attempt.password })
    console.log('result:', { data: data?.user ? { id: data.user.id, email: data.user.email } : null, error })
  } catch (e) {
    console.error('exception', e)
  }
}
