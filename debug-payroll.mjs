import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxamplvcleizbfajsobd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YW1wbHZjbGVpemJmYWpzb2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzQyMjQsImV4cCI6MjA4OTA1MDIyNH0.rkisXqaF3TZZla0_4n-gyev5r9W_5S1s55r3ZttoP14'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPayroll() {
  try {
    // 1. Get a cycle
    const { data: cycles } = await supabase.from('payroll_cycles').select('*').limit(1);
    if (!cycles || cycles.length === 0) {
      console.log('No cycles found');
      return;
    }
    const cycle = cycles[0];
    console.log('Selected cycle:', cycle.id);

    // 2. Get employees
    const { data: employees } = await supabase.from('employees').select('*');
    if (!employees || employees.length === 0) {
      console.log('No employees found');
      return;
    }
    console.log('Found employees:', employees.length);

    // 3. Try to insert a dummy payroll record
    const dummyRecord = {
      employee_id: employees[0].id,
      cycle_id: cycle.id,
      pay_period: '2026-04',
      base_salary: employees[0].salary || 0,
      gross_salary: employees[0].salary || 0,
      net_salary: employees[0].salary || 0,
      paye_tax: 0,
      payment_status: 'Processed',
      pay_date: new Date().toISOString().split('T')[0]
    };

    console.log('Inserting dummy record:', dummyRecord);
    const { error } = await supabase.from('payroll').insert([dummyRecord]);

    if (error) {
      console.error('Insert Error Detail:', JSON.stringify(error, null, 2));
    } else {
      console.log('Insert successful!');
    }
  } catch (err) {
    console.error('Script Error:', err);
  }
}

debugPayroll();
