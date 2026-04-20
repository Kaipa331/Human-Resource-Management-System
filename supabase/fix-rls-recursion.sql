-- Fix RLS Infinite Recursion Error
-- Drop existing policies that might cause recursion and recreate simple ones

-- Drop all existing policies on employees table
DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;

-- Create simple non-recursive policy that allows all operations
CREATE POLICY "Allow all operations on employees" ON public.employees
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Also ensure profiles table has correct policies
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;

CREATE POLICY "Allow all operations on profiles" ON public.profiles
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.employees TO anon;
GRANT ALL ON public.profiles TO anon;
