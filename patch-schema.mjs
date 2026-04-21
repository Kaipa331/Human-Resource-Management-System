import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxamplvcleizbfajsobd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YW1wbHZjbGVpemJmYWpzb2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzQyMjQsImV4cCI6MjA4OTA1MDIyNH0.rkisXqaF3TZZla0_4n-gyev5r9W_5S1s55r3ZttoP14'

const supabase = createClient(supabaseUrl, supabaseKey)

async function patch() {
  const { error: error1 } = await supabase.rpc('exec_sql', { sql_string: 'ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS employer_pension NUMERIC DEFAULT 0;' });
  // If rpc exec_sql doesn't exist, we can't do it via js client unless we do a REST call with postgres role.
  console.log("Tried exec_sql:", error1);
}
patch();
