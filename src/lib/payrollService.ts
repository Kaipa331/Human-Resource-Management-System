import { supabase } from './supabase';

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: string;
  join_date: string;
  salary: number | string;
  role?: string;
  employment_type: string;
}

export interface PayrollCalculation {
  employeeId: string;
  baseSalary: number;
  allowances: {
    housing: number;
    transport: number;
    meal: number;
    other: number;
  };
  deductions: {
    payeTax: number;
    pension: number;
    healthInsurance: number;
    other: number;
  };
  overtime: {
    hours: number;
    rate: number;
    pay: number;
  };
  bonuses: {
    performance: number;
    other: number;
  };
  employerCosts: {
    pension: number;
    tevetLevy: number;
    totalCTC: number;
  };
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  cycleId: string;
  payPeriod: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  otherAllowances: number;
  payeTax: number;
  pensionContrib: number;
  healthInsurance: number;
  otherDeductions: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  performanceBonus: number;
  otherBonus: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  employer_pension?: number;
  tevet_levy?: number;
  payDate: Date;
  paymentStatus: string;
  bankReference?: string;
  notes?: string;
}

export interface PayrollCycle {
  id: string;
  cycleName: string;
  startDate: Date;
  endDate: Date;
  status: 'Draft' | 'Processing' | 'Completed' | 'Cancelled';
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalTax: number;
  createdAt: Date;
}

// MRA Compliant PAYE Calculation (Malawi) - 2024/2025 Rates
const calculatePAYETax = (monthlyTaxableIncome: number): number => {
  if (monthlyTaxableIncome <= 150000) return 0;
  if (monthlyTaxableIncome <= 500000) return (monthlyTaxableIncome - 150000) * 0.25;
  if (monthlyTaxableIncome <= 2550000) return (350000 * 0.25) + (monthlyTaxableIncome - 500000) * 0.30;
  return (350000 * 0.25) + (2050000 * 0.30) + (monthlyTaxableIncome - 2550000) * 0.35;
};

// Calculate overtime pay
const calculateOvertime = (baseSalary: number, overtimeHours: number): { rate: number; pay: number } => {
  const hourlyRate = baseSalary / 160; // Assuming 160 working hours per month
  const overtimeRate = hourlyRate * 1.5; // 1.5x rate for overtime
  const overtimePay = overtimeHours * overtimeRate;
  
  return { rate: overtimeRate, pay: overtimePay };
};

// Calculate pension contribution (Statutory 5%/10% split)
const calculatePension = (baseSalary: number): { employee: number; employer: number } => {
  return {
    employee: baseSalary * 0.05,
    employer: baseSalary * 0.10
  };
};

// Calculate 1% TEVET Levy (Employer cost) - Accrual based on basic payroll
const calculateTEVETLevy = (baseSalary: number): number => {
  // For the current month, accruing 1/12th of (annual base * 1%) is mathematically equivalent to (monthly base * 1%)
  return baseSalary * 0.01;
};

// Calculate health insurance (2% of basic salary)
const calculateHealthInsurance = (baseSalary: number): number => {
  return baseSalary * 0.02;
};

const toSafeNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;
  return isNaN(num) ? 0 : num;
};

export class PayrollService {
  // Calculate payroll for a single employee
  static async calculateEmployeePayroll(
    employee: Employee,
    overtimeHours: number = 0,
    performanceBonus: number = 0,
    otherBonus: number = 0,
    manualDeduction: number = 0
  ): Promise<PayrollCalculation> {
    const baseSalary = toSafeNumber(employee.salary);
    
    // Calculate allowances
    const housingAllowance = this.calculateHousingAllowance(employee.position || 'Employee', baseSalary);
    const transportAllowance = this.calculateTransportAllowance(employee.position || 'Employee');
    const mealAllowance = this.calculateMealAllowance(employee.position || 'Employee');
    const otherAllowances = this.calculateOtherAllowances(employee.employment_type || 'Full-time');

    // Calculate overtime
    const overtime = calculateOvertime(baseSalary, overtimeHours);

    // Calculate gross salary (Sum of all income)
    const grossSalary = baseSalary + housingAllowance + transportAllowance + mealAllowance + 
                       otherAllowances + overtime.pay + performanceBonus + otherBonus;

    // Calculate Pension (Employee 5%, Employer 10%)
    const pension = calculatePension(baseSalary);

    // Taxable Income = Gross Salary - Employee Pension (Income Tax deductible)
    const taxableIncome = Math.max(0, grossSalary - pension.employee);
    const payeTax = calculatePAYETax(taxableIncome);

    const healthInsurance = calculateHealthInsurance(baseSalary);
    const tevetLevy = calculateTEVETLevy(baseSalary);

    const totalDeductions = payeTax + pension.employee + healthInsurance + manualDeduction;
    const netSalary = grossSalary - totalDeductions;

    // Total Cost to Company (CTC) = Gross Salary + Employer Pension + TEVET Levy
    const totalCTC = grossSalary + pension.employer + tevetLevy;

    return {
      employeeId: employee.id,
      baseSalary: toSafeNumber(baseSalary),
      allowances: {
        housing: toSafeNumber(housingAllowance),
        transport: toSafeNumber(transportAllowance),
        meal: toSafeNumber(mealAllowance),
        other: toSafeNumber(otherAllowances)
      },
      deductions: {
        payeTax: toSafeNumber(payeTax),
        pension: toSafeNumber(pension.employee),
        healthInsurance: toSafeNumber(healthInsurance),
        other: toSafeNumber(manualDeduction)
      },
      overtime: {
        rate: toSafeNumber(overtime.rate),
        pay: toSafeNumber(overtime.pay),
        hours: toSafeNumber(overtimeHours)
      },
      bonuses: {
        performance: toSafeNumber(performanceBonus),
        other: toSafeNumber(otherBonus)
      },
      grossSalary: toSafeNumber(grossSalary),
      totalDeductions: toSafeNumber(totalDeductions),
      netSalary: toSafeNumber(netSalary),
      employerCosts: {
        pension: toSafeNumber(pension.employer),
        tevetLevy: toSafeNumber(tevetLevy),
        totalCTC: toSafeNumber(totalCTC)
      }
    };
  }

  // Calculate housing allowance based on position
  private static calculateHousingAllowance(position: string, baseSalary: number): number {
    const allowances: Record<string, number> = {
      'Manager': baseSalary * 0.30,
      'Admin': baseSalary * 0.25,
      'HR': baseSalary * 0.20,
      'Employee': baseSalary * 0.15
    };
    
    return allowances[position] || baseSalary * 0.15;
  }

  // Calculate transport allowance based on position
  private static calculateTransportAllowance(position: string): number {
    const allowances: Record<string, number> = {
      'Manager': 50000,
      'Admin': 40000,
      'HR': 35000,
      'Employee': 25000
    };
    
    return allowances[position] || 25000;
  }

  // Calculate meal allowance based on position
  private static calculateMealAllowance(position: string): number {
    const allowances: Record<string, number> = {
      'Manager': 30000,
      'Admin': 25000,
      'HR': 20000,
      'Employee': 15000
    };
    
    return allowances[position] || 15000;
  }

  // Calculate other allowances based on employment type
  private static calculateOtherAllowances(employmentType: string): number {
    const allowances: Record<string, number> = {
      'Full-time': 20000,
      'Part-time': 10000,
      'Contract': 15000,
      'Intern': 5000,
      'Temporary': 8000
    };
    
    return allowances[employmentType] || 10000;
  }

  // Create a new payroll cycle
  static async createPayrollCycle(
    cycleName: string,
    startDate: Date,
    endDate: Date
  ): Promise<PayrollCycle | null> {
    try {
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid dates provided for payroll cycle');
        return null;
      }

      // Format dates properly for PostgreSQL
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      console.log('Creating payroll cycle with dates:', { formattedStartDate, formattedEndDate });

      const { data, error } = await supabase
        .from('payroll_cycles')
        .insert([{
          cycle_name: cycleName,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          status: 'Draft'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating payroll cycle - table may not exist:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating payroll cycle:', error);
      return null;
    }
  }

  // Get all payroll cycles
  static async getPayrollCycles(): Promise<PayrollCycle[]> {
    try {
      const { data, error } = await supabase
        .from('payroll_cycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Payroll cycles table not found, returning empty array:', error.message);
        return [];
      }

      // Map database snake_case columns to camelCase interface
      const mappedCycles = (data || []).map((cycle: any) => ({
        id: cycle.id,
        cycleName: cycle.cycle_name,
        startDate: cycle.start_date,
        endDate: cycle.end_date,
        status: cycle.status,
        totalEmployees: cycle.total_employees || 0,
        totalGross: cycle.total_gross || 0,
        totalNet: cycle.total_net || 0,
        totalTax: cycle.total_tax || 0,
        createdAt: cycle.created_at
      }));

      console.log('Mapped payroll cycles:', mappedCycles);
      return mappedCycles;
    } catch (error) {
      console.error('Error fetching payroll cycles:', error);
      return [];
    }
  }

  // Process payroll for all employees in a cycle
  static async processPayrollCycle(
    cycleId: string,
    employees: Employee[],
    adjustments: Record<string, {
      overtimeHours: number;
      performanceBonus: number;
      otherBonus: number;
      manualDeduction: number;
    }> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Processing payroll for ${employees.length} employees in cycle ${cycleId}`);
      const payrollRecords = [];

      for (const employee of employees) {
        const adj = adjustments[employee.id] || {
          overtimeHours: 0,
          performanceBonus: 0,
          otherBonus: 0,
          manualDeduction: 0
        };

        const calculation = await this.calculateEmployeePayroll(
          employee, 
          adj.overtimeHours, 
          adj.performanceBonus, 
          adj.otherBonus,
          adj.manualDeduction
        );
        
        const payrollRecord = {
          employee_id: employee.employee_id || employee.id,
          cycle_id: cycleId,
          pay_period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          base_salary: calculation.baseSalary,
          housing_allowance: calculation.allowances.housing,
          transport_allowance: calculation.allowances.transport,
          meal_allowance: calculation.allowances.meal,
          other_allowances: calculation.allowances.other,
          paye_tax: calculation.deductions.payeTax,
          pension_contrib: calculation.deductions.pension,
          health_insurance: calculation.deductions.healthInsurance,
          other_deductions: calculation.deductions.other,
          overtime_hours: calculation.overtime.hours,
          overtime_rate: calculation.overtime.rate,
          overtime_pay: calculation.overtime.pay,
          performance_bonus: calculation.bonuses.performance,
          other_bonus: calculation.bonuses.other,
          gross_salary: calculation.grossSalary,
          total_deductions: calculation.totalDeductions,
          net_salary: calculation.netSalary,
          employer_pension: calculation.employerCosts.pension,
          tevet_levy: calculation.employerCosts.tevetLevy,
          pay_date: new Date().toISOString().split('T')[0],
          payment_status: 'Processed'
        };

        payrollRecords.push(payrollRecord);
      }

      console.log('Inserting payroll records into database...');
      const { error } = await supabase
        .from('payroll')
        .insert(payrollRecords);

      if (error) {
        console.error('Error inserting payroll records:', error);
        return { success: false, error: error.message };
      }

      console.log('Updating payroll cycle totals...');
      const { error: updateError } = await supabase
        .from('payroll_cycles')
        .update({
          status: 'Completed',
          total_employees: employees.length,
          total_gross: toSafeNumber(payrollRecords.reduce((sum, record) => sum + record.gross_salary, 0)),
          total_net: toSafeNumber(payrollRecords.reduce((sum, record) => sum + record.net_salary, 0)),
          total_tax: toSafeNumber(payrollRecords.reduce((sum, record) => sum + record.paye_tax, 0))
        })
        .eq('id', cycleId);

      if (updateError) {
        console.error('Error updating payroll cycle:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('Payroll processing completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Unexpected error during payroll processing:', error);
      return { success: false, error: error?.message || 'An unexpected error occurred' };
    }
  }

  // Get payroll records for a specific cycle
  static async getPayrollRecords(cycleId?: string): Promise<PayrollRecord[]> {
    try {
      let query = supabase
        .from('payroll')
        .select(`
          *,
          employees:employee_id (
            name,
            email,
            employee_id,
            department,
            position
          )
        `);

      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Payroll table not found, returning empty array:', error.message);
        return [];
      }

      // Map database snake_case columns to camelCase interface
      return (data || []).map((record: any) => ({
        id: record.id,
        employeeId: record.employee_id,
        cycleId: record.cycle_id,
        payPeriod: record.pay_period,
        baseSalary: record.base_salary,
        housingAllowance: record.housing_allowance,
        transportAllowance: record.transport_allowance,
        mealAllowance: record.meal_allowance,
        otherAllowances: record.other_allowances,
        payeTax: record.paye_tax,
        pensionContrib: record.pension_contrib,
        healthInsurance: record.health_insurance,
        otherDeductions: record.other_deductions,
        overtimeHours: record.overtime_hours,
        overtimeRate: record.overtime_rate,
        overtimePay: record.overtime_pay,
        performanceBonus: record.performance_bonus,
        otherBonus: record.other_bonus,
        grossSalary: record.gross_salary,
        totalDeductions: record.total_deductions,
        netSalary: record.net_salary,
        payDate: record.pay_date,
        paymentStatus: record.payment_status,
        bankReference: record.bank_reference,
        notes: record.notes,
        employer_pension: record.employer_pension,
        tevet_levy: record.tevet_levy,
        employees: record.employees
      }));
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      return [];
    }
  }

  // Get payroll summary for dashboard
  static async getPayrollSummary(): Promise<{
    totalEmployees: number;
    totalGross: number;
    totalNet: number;
    totalTax: number;
    totalBonuses: number;
    totalDeductions: number;
    totalAllowances: number;
    totalCTC: number;
    totalEmployerLiabilities: number;
    averageSalary: number;
  }> {
    try {
      // 1. Get current workforce stats from 'employees' table
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('salary')
        .eq('status', 'Active');

      if (employeeError) {
        console.error('Error fetching employee workforce stats:', employeeError.message);
      }

      const activeEmployees = employeeData || [];
      const currentEmployeeCount = activeEmployees.length;
      
      const totalPotentialBaseSalary = activeEmployees.reduce((sum, emp) => {
        const val = typeof emp.salary === 'string' ? parseFloat(emp.salary) : emp.salary;
        return sum + (isNaN(val as number) ? 0 : (val as number));
      }, 0);

      const currentAverageSalary = currentEmployeeCount > 0 ? totalPotentialBaseSalary / currentEmployeeCount : 0;

      // 2. Get historical payroll stats from 'payroll' table
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select(`
          gross_salary, 
          net_salary, 
          paye_tax, 
          performance_bonus, 
          other_bonus, 
          total_deductions,
          housing_allowance,
          transport_allowance,
          meal_allowance,
          other_allowances
        `);

      if (payrollError) {
        console.warn('Payroll table not found or empty, using defaults for historical data:', payrollError.message);
      }

      const records = payrollData || [];
      
      const totalGross = records.reduce((sum, record) => sum + toSafeNumber(record.gross_salary), 0);
      const totalNet = records.reduce((sum, record) => sum + toSafeNumber(record.net_salary), 0);
      const totalTax = records.reduce((sum, record) => sum + toSafeNumber(record.paye_tax), 0);
      const totalEmployeePension = records.reduce((sum, record) => sum + toSafeNumber(record.pension_contrib), 0);
      
      const totalBonuses = records.reduce((sum, record) => 
        sum + toSafeNumber(record.performance_bonus) + toSafeNumber(record.other_bonus), 0);
      const totalDeductions = records.reduce((sum, record) => sum + toSafeNumber(record.total_deductions), 0);
      const totalAllowances = records.reduce((sum, record) => 
        sum + toSafeNumber(record.housing_allowance) + toSafeNumber(record.transport_allowance) + 
        toSafeNumber(record.meal_allowance) + toSafeNumber(record.other_allowances), 0);

      // Calculate Employer Costs and Liabilities (derived for historical records)
      const totalEmployerPension = totalGross * 0.10; // Accrued
      const totalTEVET = totalGross * 0.01; // Accrued
      const totalCTC = totalGross + totalEmployerPension + totalTEVET;
      
      // Total amount due to authorities (PAYE + All Pension + TEVET)
      const totalEmployerLiabilities = totalTax + totalEmployeePension + totalEmployerPension + totalTEVET;

      // We return the total number of Active Employees as the primary stat
      // but historical totals for the financial metrics
      return {
        totalEmployees: currentEmployeeCount,
        totalGross: totalGross > 0 ? totalGross : totalPotentialBaseSalary,
        totalNet,
        totalTax,
        totalBonuses,
        totalDeductions,
        totalAllowances,
        totalCTC: totalGross > 0 ? totalCTC : totalPotentialBaseSalary * 1.11, // Basic accrual for idealized view
        totalEmployerLiabilities: totalGross > 0 ? totalEmployerLiabilities : (totalPotentialBaseSalary * 0.11),
        averageSalary: currentAverageSalary
      };
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      return {
        totalEmployees: 0,
        totalGross: 0,
        totalNet: 0,
        totalTax: 0,
        totalBonuses: 0,
        totalDeductions: 0,
        totalAllowances: 0,
        averageSalary: 0
      };
    }
  }
}
