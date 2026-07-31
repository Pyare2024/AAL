import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n');
let url = '', key = '';
for (let line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].replace(/["']/g, '').trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].replace(/["']/g, '').trim();
}

const supabase = createClient(url, key);

async function check() {
  const { data: allRoles } = await supabase.from('user_roles').select('*');
  console.log('All user_roles in DB:', allRoles);

  const { data: internRoles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'intern');
  console.log('Intern roles:', internRoles, roleError);

  const internIds = (internRoles || []).map(r => r.user_id);
  console.log('Intern IDs:', internIds);

  if (internIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, account_status, onboarding_status')
      .in('id', internIds);
    console.log('Intern profiles:', profiles);
  }
}

check();
