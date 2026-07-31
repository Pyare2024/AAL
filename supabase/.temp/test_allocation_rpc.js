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

async function testAllocationRPC() {
  console.log('Testing RPC assign_intern_problem_statement...');
  const { data: ps } = await supabase.from('problem_statements').select('id, title').limit(1).single();
  const { data: intern } = await supabase.from('profiles').select('id, full_name').limit(1).single();

  if (!ps || !intern) {
    console.log('No ps or intern found to test allocation.');
    return;
  }

  console.log(`Target Intern: ${intern.full_name} (${intern.id}), Target PS: ${ps.title} (${ps.id})`);

  const { data: rpcRes, error: rpcErr } = await supabase.rpc('assign_intern_problem_statement', {
    p_intern_id: intern.id,
    p_problem_statement_id: ps.id,
    p_allocated_by: intern.id,
    p_allocation_note: 'Test automated allocation'
  });

  console.log('RPC execution result:', rpcRes, rpcErr);

  const { data: history } = await supabase.from('intern_problem_statement_history').select('*').eq('intern_id', intern.id);
  console.log('Audit history records:', history);
}

testAllocationRPC();
