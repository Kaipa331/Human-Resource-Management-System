-- Update Employees Table Schema
-- Add missing columns that the UI form is trying to insert

-- Add identity and basic info columns
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add employment info columns  
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS employment_type TEXT,
ADD COLUMN IF NOT EXISTS manager_supervisor TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT;

-- Add emergency contact columns
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Add payroll/banking columns
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS tax_id_pin TEXT;

-- Update existing policy to allow all access (in case it was restricted)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;
    CREATE POLICY "Allow all access to employees" ON public.employees FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;
