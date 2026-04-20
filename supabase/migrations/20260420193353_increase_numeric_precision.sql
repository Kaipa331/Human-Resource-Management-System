-- Increase precision for all currency columns in payroll and payroll_cycles tables
-- to handle large Malawian Kwacha values safely.

-- Alter payroll table
ALTER TABLE public.payroll 
    ALTER COLUMN base_salary TYPE NUMERIC(20,2),
    ALTER COLUMN housing_allowance TYPE NUMERIC(20,2),
    ALTER COLUMN transport_allowance TYPE NUMERIC(20,2),
    ALTER COLUMN meal_allowance TYPE NUMERIC(20,2),
    ALTER COLUMN other_allowances TYPE NUMERIC(20,2),
    ALTER COLUMN paye_tax TYPE NUMERIC(20,2),
    ALTER COLUMN pension_contrib TYPE NUMERIC(20,2),
    ALTER COLUMN health_insurance TYPE NUMERIC(20,2),
    ALTER COLUMN other_deductions TYPE NUMERIC(20,2),
    ALTER COLUMN overtime_rate TYPE NUMERIC(20,2),
    ALTER COLUMN overtime_pay TYPE NUMERIC(20,2),
    ALTER COLUMN performance_bonus TYPE NUMERIC(20,2),
    ALTER COLUMN other_bonus TYPE NUMERIC(20,2),
    ALTER COLUMN gross_salary TYPE NUMERIC(20,2),
    ALTER COLUMN total_deductions TYPE NUMERIC(20,2),
    ALTER COLUMN net_salary TYPE NUMERIC(20,2),
    ALTER COLUMN employer_pension TYPE NUMERIC(20,2),
    ALTER COLUMN tevet_levy TYPE NUMERIC(20,2),
    ALTER COLUMN overtime_hours TYPE NUMERIC(10,2);

-- Alter payroll_cycles table
ALTER TABLE public.payroll_cycles 
    ALTER COLUMN total_gross TYPE NUMERIC(20,2),
    ALTER COLUMN total_net TYPE NUMERIC(20,2),
    ALTER COLUMN total_tax TYPE NUMERIC(20,2);
