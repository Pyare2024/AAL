import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envStr = fs.readFileSync(envPath, 'utf8');

const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.*)/);
const anonMatch = envStr.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (urlMatch && anonMatch) {
  const supabase = createClient(urlMatch[1].trim(), anonMatch[1].trim());
  supabase.from('profiles').select('*').limit(1).then(({ data, error }) => {
    if (error) console.error('Error:', error);
    else if (data && data.length > 0) console.log('Columns:', Object.keys(data[0]));
    else console.log('No data');
  });
} else {
  console.log('No env vars found');
}
