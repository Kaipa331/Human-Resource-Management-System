import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxamplvcleizbfajsobd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YW1wbHZjbGVpemJmYWpzb2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzQyMjQsImV4cCI6MjA4OTA1MDIyNH0.rkisXqaF3TZZla0_4n-gyev5r9W_5S1s55r3ZttoP14'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPayrollFull() {
  try {
    const { data: cycles } = await supabase.from('payroll_cycles').select('*').limit(1);
    const { data: employees } = await supabase.from('employees').select('*');
    if (!cycles || !employees || employees.length === 0) return;

    const fullRecord = {
      employee_id: employees[0].id,
      cycle_id: cycles[0].id,
      pay_period: '2026-04',
      base_salary: 1000000,
      housing_allowance: 150000,
      transport_allowance: 50000,
      meal_allowance: 30000,
      other_allowances: 20000,
      paye_tax: 242500,
      pension_contrib: 50000,
      health_insurance: 20000,
      other_deductions: 0,
      overtime_hours: 0,
      overtime_rate: 0,
      overtime_pay: 0,
      performance_bonus: 0,
      other_bonus: 0,
      gross_salary: 1250000,
      total_deductions: 312500,
      net_salary: 937500,
      pay_date: '2026-04-20',
      payment_status: 'Processed'
    };

    console.log('Inserting full record...');
    const { error } = await supabase.from('payroll').insert([fullRecord]);

    if (error) {
      console.error('Insert Error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Full insert successful!');
    }
  } catch (err) {
    console.error('Script Error:', err);
  }
}

debugPayrollFull();
