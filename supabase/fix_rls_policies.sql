-- Fix RLS Policies for All Tables
-- Remove problematic policies and create simple ones

-- Drop all existing policies on employees
DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;

-- Create simple policy for employees
CREATE POLICY "Allow all operations on employees" ON public.employees
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Drop all existing policies on profiles  
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;

-- Create simple policy for profiles
CREATE POLICY "Allow all operations on profiles" ON public.profiles
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Drop all existing policies on payroll
DROP POLICY IF EXISTS "Allow all access to payroll" ON public.payroll;

-- Create simple policy for payroll
CREATE POLICY "Allow all operations on payroll" ON public.payroll
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Drop all existing policies on payroll_cycles
DROP POLICY IF EXISTS "Allow all access to payroll_cycles" ON public.payroll_cycles;

-- Create simple policy for payroll_cycles
CREATE POLICY "Allow all operations on payroll_cycles" ON public.payroll_cycles
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Drop all existing policies on performance_reviews
DROP POLICY IF EXISTS "Allow all access to performance_reviews" ON public.performance_reviews;

-- Create simple policy for performance_reviews
CREATE POLICY "Allow all operations on performance_reviews" ON public.performance_reviews
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Drop all existing policies on training_courses
DROP POLICY IF EXISTS "Allow all access to training_courses" ON public.training_courses;

-- Create simple policy for training_courses
CREATE POLICY "Allow all operations on training_courses" ON public.training_courses
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Drop all existing policies on training_enrollments
DROP POLICY IF EXISTS "Allow all access to training_enrollments" ON public.training_enrollments;

-- Create simple policy for training_enrollments
CREATE POLICY "Allow all operations on training_enrollments" ON public.training_enrollments
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Drop all existing policies on report_schedules
DROP POLICY IF EXISTS "Allow all access to report_schedules" ON public.report_schedules;

-- Create simple policy for report_schedules
CREATE POLICY "Allow all operations on report_schedules" ON public.report_schedules
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.employees TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.payroll TO authenticated;
GRANT ALL ON public.payroll TO anon;
GRANT ALL ON public.payroll_cycles TO authenticated;
GRANT ALL ON public.payroll_cycles TO anon;
GRANT ALL ON public.performance_reviews TO authenticated;
GRANT ALL ON public.performance_reviews TO anon;
GRANT ALL ON public.training_courses TO authenticated;
GRANT ALL ON public.training_courses TO anon;
GRANT ALL ON public.training_enrollments TO authenticated;
GRANT ALL ON public.training_enrollments TO anon;
GRANT ALL ON public.report_schedules TO authenticated;
GRANT ALL ON public.report_schedules TO anon;
