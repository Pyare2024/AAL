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
  const { data: roles, error: e1 } = await supabase.from('user_roles').select('*');
  console.log('user_roles table content:', roles, e1);

  const { data: profiles, error: e2 } = await supabase.from('profiles').select('id, full_name, email, account_status, onboarding_status');
  console.log('profiles table content:', profiles, e2);
}

check();
