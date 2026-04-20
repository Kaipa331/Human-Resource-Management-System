-- Add department field to employees table
-- This migration adds the missing department field

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add comment
COMMENT ON COLUMN public.employees.department IS 'Employee department or division';
