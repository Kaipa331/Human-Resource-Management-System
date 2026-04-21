import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxamplvcleizbfajsobd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YW1wbHZjbGVpemJmYWpzb2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzQyMjQsImV4cCI6MjA4OTA1MDIyNH0.rkisXqaF3TZZla0_4n-gyev5r9W_5S1s55r3ZttoP14'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('payroll_cycles').select('*').limit(1);
  console.log("Data:", data, "Error:", error);
}
run();
