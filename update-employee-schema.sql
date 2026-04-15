-- Update Employee Schema with Comprehensive Fields
-- This script adds all core fields for real employee management

-- First, add new columns to existing employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS employment_type TEXT CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Intern', 'Temporary')),
ADD COLUMN IF NOT EXISTS manager_supervisor TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS tax_id_pin TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.employees.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN public.employees.gender IS 'Employee gender (Male, Female, Other, Prefer not to say)';
COMMENT ON COLUMN public.employees.address IS 'Employee residential address';
COMMENT ON COLUMN public.employees.employment_type IS 'Employment type (Full-time, Part-time, Contract, Intern, Temporary)';
COMMENT ON COLUMN public.employees.manager_supervisor IS 'Manager or supervisor name';
COMMENT ON COLUMN public.employees.work_location IS 'Primary work location';
COMMENT ON COLUMN public.employees.emergency_contact_name IS 'Emergency contact person name';
COMMENT ON COLUMN public.employees.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN public.employees.emergency_contact_relationship IS 'Relationship to emergency contact';
COMMENT ON COLUMN public.employees.bank_name IS 'Bank name for payroll';
COMMENT ON COLUMN public.employees.bank_account_number IS 'Bank account number for salary deposits';
COMMENT ON COLUMN public.employees.tax_id_pin IS 'Tax ID or PIN for tax purposes';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_gender ON public.employees(gender);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON public.employees(employment_type);
CREATE INDEX IF NOT EXISTS idx_employees_work_location ON public.employees(work_location);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON public.employees(manager_supervisor);

-- Update existing records with default values where possible
UPDATE public.employees 
SET 
    employment_type = 'Full-time',
    work_location = 'Main Office'
WHERE employment_type IS NULL OR work_location IS NULL;

DO $$
BEGIN
    RAISE NOTICE 'Employee schema updated successfully with all core fields';
    RAISE NOTICE 'Added: Identity, Employment, Emergency, and Payroll fields';
END $$;
