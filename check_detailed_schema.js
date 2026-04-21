import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: empCols } = await supabase.rpc('get_column_details', { table_name: 'employees' });
  const { data: succCols } = await supabase.rpc('get_column_details', { table_name: 'succession_plans' });
  
  console.log('Employee Columns:', empCols);
  console.log('Succession Plans Columns:', succCols);
}

// Fallback if RPC doesn't exist
async function fallback() {
  const { data: emp } = await supabase.from('employees').select('*').limit(1);
  const { data: succ } = await supabase.from('succession_plans').select('*').limit(1);
  console.log('Employee Sample:', emp);
  console.log('Succession Sample:', succ);
}
fallback();
