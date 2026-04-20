-- Add employer_pension and tevet_levy columns to payroll table
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS employer_pension NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tevet_levy NUMERIC(12,2) DEFAULT 0;

-- Add comments for the new columns
COMMENT ON COLUMN public.payroll.employer_pension IS 'Employer 10% pension contribution';
COMMENT ON COLUMN public.payroll.tevet_levy IS 'Employer 1% TEVET levy';
