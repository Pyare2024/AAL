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

async function verifyFunctions() {
  console.log('Testing RPC get_current_user_context...');
  const { data: d1, error: e1 } = await supabase.rpc('get_current_user_context');
  console.log('get_current_user_context result:', d1, e1);

  console.log('Testing RPC get_intern_dashboard_summary...');
  const { data: d2, error: e2 } = await supabase.rpc('get_intern_dashboard_summary');
  console.log('get_intern_dashboard_summary result:', d2, e2);
}

verifyFunctions();
