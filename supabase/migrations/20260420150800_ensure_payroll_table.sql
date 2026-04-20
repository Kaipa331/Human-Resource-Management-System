-- Ensure payroll table exists with correct schema
-- This migration creates the payroll table for storing individual payroll records

CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    employee_id UUID NOT NULL,
    cycle_id UUID NOT NULL,
    pay_period VARCHAR(20) NOT NULL,
    base_salary NUMERIC(12,2) NOT NULL,
    housing_allowance NUMERIC(12,2) DEFAULT 0,
    transport_allowance NUMERIC(12,2) DEFAULT 0,
    meal_allowance NUMERIC(12,2) DEFAULT 0,
    other_allowances NUMERIC(12,2) DEFAULT 0,
    paye_tax NUMERIC(12,2) DEFAULT 0,
    pension_contrib NUMERIC(12,2) DEFAULT 0,
    health_insurance NUMERIC(12,2) DEFAULT 0,
    other_deductions NUMERIC(12,2) DEFAULT 0,
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    overtime_rate NUMERIC(12,2) DEFAULT 0,
    overtime_pay NUMERIC(12,2) DEFAULT 0,
    performance_bonus NUMERIC(12,2) DEFAULT 0,
    other_bonus NUMERIC(12,2) DEFAULT 0,
    gross_salary NUMERIC(12,2) NOT NULL,
    total_deductions NUMERIC(12,2) NOT NULL,
    net_salary NUMERIC(12,2) NOT NULL,
    pay_date DATE NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'Processed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT payroll_pkey PRIMARY KEY (id),
    CONSTRAINT payroll_employee_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE,
    CONSTRAINT payroll_cycle_fkey FOREIGN KEY (cycle_id) REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
    CONSTRAINT payroll_payment_status_check CHECK (
        payment_status IN ('Processed', 'Pending', 'Paid', 'Cancelled')
    )
);

-- Add comments
COMMENT ON TABLE public.payroll IS 'Individual payroll records for employees';
COMMENT ON COLUMN public.payroll.employee_id IS 'Reference to employee record';
COMMENT ON COLUMN public.payroll.cycle_id IS 'Reference to payroll cycle';
COMMENT ON COLUMN public.payroll.pay_period IS 'Pay period (YYYY-MM format)';
COMMENT ON COLUMN public.payroll.base_salary IS 'Basic salary amount';
COMMENT ON COLUMN public.payroll.housing_allowance IS 'Housing allowance amount';
COMMENT ON COLUMN public.payroll.transport_allowance IS 'Transport allowance amount';
COMMENT ON COLUMN public.payroll.meal_allowance IS 'Meal allowance amount';
COMMENT ON COLUMN public.payroll.other_allowances IS 'Other allowances amount';
COMMENT ON COLUMN public.payroll.paye_tax IS 'PAYE tax amount';
COMMENT ON COLUMN public.payroll.pension_contrib IS 'Pension contribution amount';
COMMENT ON COLUMN public.payroll.health_insurance IS 'Health insurance amount';
COMMENT ON COLUMN public.payroll.other_deductions IS 'Other deductions amount';
COMMENT ON COLUMN public.payroll.overtime_hours IS 'Overtime hours worked';
COMMENT ON COLUMN public.payroll.overtime_rate IS 'Overtime hourly rate';
COMMENT ON COLUMN public.payroll.overtime_pay IS 'Overtime pay amount';
COMMENT ON COLUMN public.payroll.performance_bonus IS 'Performance bonus amount';
COMMENT ON COLUMN public.payroll.other_bonus IS 'Other bonus amount';
COMMENT ON COLUMN public.payroll.gross_salary IS 'Total gross salary';
COMMENT ON COLUMN public.payroll.total_deductions IS 'Total deductions amount';
COMMENT ON COLUMN public.payroll.net_salary IS 'Net salary after deductions';
COMMENT ON COLUMN public.payroll.pay_date IS 'Payment date';
COMMENT ON COLUMN public.payroll.payment_status IS 'Payment status';

-- Enable RLS
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Create simple policy for payroll
DROP POLICY IF EXISTS "Allow all operations on payroll" ON public.payroll;
CREATE POLICY "Allow all operations on payroll" ON public.payroll
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.payroll TO authenticated;
GRANT ALL ON public.payroll TO anon;
GRANT ALL ON public.payroll TO service_role;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_payroll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_payroll_updated_at ON public.payroll;
CREATE TRIGGER handle_payroll_updated_at
    BEFORE UPDATE ON public.payroll
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payroll_updated_at();

-- Verify table creation
SELECT 'payroll table created/verified successfully' as status;
