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

async function run() {
  const sql = fs.readFileSync('supabase/.temp/exec_migration.sql', 'utf8');

  console.log('1. Executing migration helper...');
  const { data: res1, error: e1 } = await supabase.rpc('exec_migration_repair');
  console.log('rpc exec_migration_repair result:', res1, e1);

  console.log('2. Running orphan check...');
  const { data: orphans, error: e2 } = await supabase
    .from('questionnaire_submissions')
    .select('id, intern_id, profiles!fk_questionnaire_submissions_intern(id)');
  console.log('Orphan query result (expected 0 orphans without profile):', orphans?.filter(o => !o.profiles), e2);

  console.log('3. Fetching restored profile for Hemlata...');
  const { data: profile, error: e3 } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'dfb60f41-fa04-415c-8061-8f0513e9addd')
    .single();
  console.log('Restored profile row:', profile, e3);

  console.log('4. Testing Assessment Queue query...');
  const { data: queueSubmissions, error: e4 } = await supabase
    .from('questionnaire_submissions')
    .select(`
      *,
      questionnaires (id, title, category),
      profiles:intern_id!fk_questionnaire_submissions_intern (id, full_name, email, college_name, city, onboarding_status)
    `);
  console.log('Assessment Queue query success count:', queueSubmissions?.length, 'Error:', e4);
}

run();
