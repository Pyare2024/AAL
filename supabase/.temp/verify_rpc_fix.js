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
  console.log('Testing RPC get_intern_dashboard_summary after schema fix...');
  const { data, error } = await supabase.rpc('get_intern_dashboard_summary');
  console.log('get_intern_dashboard_summary result:', data, error);
}

verifyFunctions();
