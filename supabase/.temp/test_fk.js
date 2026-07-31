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
  const { data: res1, error: e1 } = await supabase.from('questionnaire_submissions').select('*, profiles:intern_id(*)');
  console.log('Query profiles:intern_id(*):', res1 ? res1.length : null, e1);

  const { data: res2, error: e2 } = await supabase.from('questionnaire_submissions').select('*, profiles(*)');
  console.log('Query profiles(*):', res2 ? res2.length : null, e2);
}

check();
