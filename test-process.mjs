import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxamplvcleizbfajsobd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YW1wbHZjbGVpemJmYWpzb2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzQyMjQsImV4cCI6MjA4OTA1MDIyNH0.rkisXqaF3TZZla0_4n-gyev5r9W_5S1s55r3ZttoP14'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const { error } = await supabase.from('payroll').insert([{
    employee_id: "78809ff4-93c2-4cb6-82ec-da2cc0b1d06b", // any UUID
    cycle_id: "c4061a5c-3940-4fbd-86cb-c05aebd5c52c", // the cycle found earlier
    employer_pension: 1000,
    tevet_levy: 100
  }]);
  console.log("Error when testing new columns:", error);
}
testInsert();
