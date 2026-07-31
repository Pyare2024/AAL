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
  const { data: userRoles, error: e1 } = await supabase.from('user_roles').select('*').eq('user_id', 'dfb60f41-fa04-415c-8061-8f0513e9addd');
  console.log('user_roles:', JSON.stringify(userRoles), e1);

  const { data: onboarding, error: e2 } = await supabase.from('onboarding_progress').select('*').eq('intern_id', 'dfb60f41-fa04-415c-8061-8f0513e9addd');
  console.log('onboarding_progress:', JSON.stringify(onboarding), e2);

  const { data: questionnaireSub, error: e3 } = await supabase.from('questionnaire_submissions').select('*').eq('intern_id', 'dfb60f41-fa04-415c-8061-8f0513e9addd');
  console.log('questionnaire_submissions:', JSON.stringify(questionnaireSub), e3);

  const { data: hist, error: e4 } = await supabase.from('intern_problem_statement_history').select('*').eq('intern_id', 'dfb60f41-fa04-415c-8061-8f0513e9addd');
  console.log('intern_problem_statement_history:', JSON.stringify(hist), e4);
}

check();
