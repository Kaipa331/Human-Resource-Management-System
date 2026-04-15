import { supabase } from './supabase';
import { Employee } from '../app/pages/Employees';

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
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
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

// Malawi-specific tax calculation
const calculatePAYETax = (grossSalary: number): number => {
  // Malawi PAYE tax rates (2024)
  if (grossSalary <= 100000) return 0;
  if (grossSalary <= 250000) return (grossSalary - 100000) * 0.20;
  if (grossSalary <= 500000) return 30000 + (grossSalary - 250000) * 0.25;
  if (grossSalary <= 1000000) return 92500 + (grossSalary - 500000) * 0.30;
  return 242500 + (grossSalary - 1000000) * 0.35;
};

// Calculate overtime pay
const calculateOvertime = (baseSalary: number, overtimeHours: number): { rate: number; pay: number } => {
  const hourlyRate = baseSalary / 160; // Assuming 160 working hours per month
  const overtimeRate = hourlyRate * 1.5; // 1.5x rate for overtime
  const overtimePay = overtimeHours * overtimeRate;
  
  return { rate: overtimeRate, pay: overtimePay };
};

// Calculate pension contribution (5% of basic salary)
const calculatePension = (baseSalary: number): number => {
  return baseSalary * 0.05;
};

// Calculate health insurance (2% of basic salary)
const calculateHealthInsurance = (baseSalary: number): number => {
  return baseSalary * 0.02;
};

export class PayrollService {
  // Calculate payroll for a single employee
  static async calculateEmployeePayroll(
    employee: Employee,
    overtimeHours: number = 0,
    performanceBonus: number = 0,
    otherBonus: number = 0
  ): Promise<PayrollCalculation> {
    const baseSalary = typeof employee.salary === 'string' ? parseFloat(employee.salary) : employee.salary;
    
    // Calculate allowances based on employee position and department
    const housingAllowance = this.calculateHousingAllowance(employee.position, baseSalary);
    const transportAllowance = this.calculateTransportAllowance(employee.position);
    const mealAllowance = this.calculateMealAllowance(employee.position);
    const otherAllowances = this.calculateOtherAllowances(employee.employment_type);

    // Calculate overtime
    const overtime = calculateOvertime(baseSalary, overtimeHours);

    // Calculate gross salary
    const grossSalary = baseSalary + housingAllowance + transportAllowance + mealAllowance + 
                       otherAllowances + overtime.pay + performanceBonus + otherBonus;

    // Calculate deductions
    const payeTax = calculatePAYETax(grossSalary);
    const pension = calculatePension(baseSalary);
    const healthInsurance = calculateHealthInsurance(baseSalary);
    const otherDeductions = 0; // Can be customized based on employee-specific deductions

    const totalDeductions = payeTax + pension + healthInsurance + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    return {
      employeeId: employee.id,
      baseSalary,
      allowances: {
        housing: housingAllowance,
        transport: transportAllowance,
        meal: mealAllowance,
        other: otherAllowances
      },
      deductions: {
        payeTax,
        pension,
        healthInsurance,
        other: otherDeductions
      },
      overtime,
      bonuses: {
        performance: performanceBonus,
        other: otherBonus
      },
      grossSalary,
      totalDeductions,
      netSalary
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
      const { data, error } = await supabase
        .from('payroll_cycles')
        .insert([{
          cycle_name: cycleName,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'Draft'
        }])
        .select()
        .single();

      if (error) throw error;
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payroll cycles:', error);
      return [];
    }
  }

  // Process payroll for all employees in a cycle
  static async processPayrollCycle(
    cycleId: string,
    employees: Employee[]
  ): Promise<boolean> {
    try {
      const payrollRecords = [];

      for (const employee of employees) {
        const calculation = await this.calculateEmployeePayroll(employee);
        
        const payrollRecord = {
          employee_id: employee.id,
          cycle_id: cycleId,
          pay_period: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
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
          pay_date: new Date().toISOString().split('T')[0],
          payment_status: 'Processed'
        };

        payrollRecords.push(payrollRecord);
      }

      // Insert all payroll records
      const { error } = await supabase
        .from('payroll')
        .insert(payrollRecords);

      if (error) throw error;

      // Update cycle status
      await supabase
        .from('payroll_cycles')
        .update({
          status: 'Completed',
          total_employees: employees.length,
          total_gross: payrollRecords.reduce((sum, record) => sum + record.gross_salary, 0),
          total_net: payrollRecords.reduce((sum, record) => sum + record.net_salary, 0),
          total_tax: payrollRecords.reduce((sum, record) => sum + record.paye_tax, 0)
        })
        .eq('id', cycleId);

      return true;
    } catch (error) {
      console.error('Error processing payroll cycle:', error);
      return false;
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

      if (error) throw error;
      return data || [];
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
    averageSalary: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('base_salary, gross_salary, net_salary, paye_tax');

      if (error) throw error;

      const records = data || [];
      const totalEmployees = records.length;
      const totalGross = records.reduce((sum, record) => sum + record.gross_salary, 0);
      const totalNet = records.reduce((sum, record) => sum + record.net_salary, 0);
      const totalTax = records.reduce((sum, record) => sum + record.paye_tax, 0);
      const averageSalary = totalEmployees > 0 ? totalGross / totalEmployees : 0;

      return {
        totalEmployees,
        totalGross,
        totalNet,
        totalTax,
        averageSalary
      };
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      return {
        totalEmployees: 0,
        totalGross: 0,
        totalNet: 0,
        totalTax: 0,
        averageSalary: 0
      };
    }
  }
}
