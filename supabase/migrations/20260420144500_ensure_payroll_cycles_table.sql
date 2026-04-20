-- Ensure payroll_cycles table exists with correct schema
-- This migration fixes missing payroll_cycles table that prevents payroll cycle creation

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS public.payroll_cycles (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    cycle_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft',
    total_employees INTEGER DEFAULT 0,
    total_gross NUMERIC(12,2) DEFAULT 0,
    total_net NUMERIC(12,2) DEFAULT 0,
    total_tax NUMERIC(12,2) DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT payroll_cycles_pkey PRIMARY KEY (id),
    CONSTRAINT payroll_cycles_status_check CHECK (
        status IN ('Draft', 'Processing', 'Completed', 'Cancelled')
    )
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payroll_cycles_created_by_fkey' 
        AND table_name = 'payroll_cycles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payroll_cycles 
        ADD CONSTRAINT payroll_cycles_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.payroll_cycles IS 'Payroll processing cycles for batch payroll runs';
COMMENT ON COLUMN public.payroll_cycles.cycle_name IS 'Name of the payroll cycle';
COMMENT ON COLUMN public.payroll_cycles.start_date IS 'Start date of the payroll period';
COMMENT ON COLUMN public.payroll_cycles.end_date IS 'End date of the payroll period';
COMMENT ON COLUMN public.payroll_cycles.status IS 'Current status of the payroll cycle';
COMMENT ON COLUMN public.payroll_cycles.total_employees IS 'Total number of employees in this cycle';
COMMENT ON COLUMN public.payroll_cycles.total_gross IS 'Total gross salary amount for this cycle';
COMMENT ON COLUMN public.payroll_cycles.total_net IS 'Total net salary amount for this cycle';
COMMENT ON COLUMN public.payroll_cycles.total_tax IS 'Total tax amount for this cycle';

-- Enable RLS
ALTER TABLE public.payroll_cycles ENABLE ROW LEVEL SECURITY;

-- Create simple policy for payroll cycles
DROP POLICY IF EXISTS "Allow all operations on payroll_cycles" ON public.payroll_cycles;
CREATE POLICY "Allow all operations on payroll_cycles" ON public.payroll_cycles
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.payroll_cycles TO authenticated;
GRANT ALL ON public.payroll_cycles TO anon;
GRANT ALL ON public.payroll_cycles TO service_role;

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_payroll_cycles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_payroll_cycles_updated_at ON public.payroll_cycles;
CREATE TRIGGER handle_payroll_cycles_updated_at
    BEFORE UPDATE ON public.payroll_cycles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payroll_cycles_updated_at();

-- Verify table creation
SELECT 'payroll_cycles table created/verified successfully' as status;
