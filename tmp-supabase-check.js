const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const envPath = path.join(process.cwd(), '.env.local');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const vars = {};
env.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) vars[m[1]] = m[2];
});
if (!vars.VITE_SUPABASE_URL || !vars.VITE_SUPABASE_ANON_KEY) {
  console.error('No supabase env found.');
  process.exit(1);
}
const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY);
(async () => {
  try {
    const { data, error } = await supabase.from('user_accounts').select('id,employee_id,employee_name,email,username,auth_user_id,account_status,role_id,role_name').limit(20);
    console.log('error', JSON.stringify(error, null, 2));
    console.log('data', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
