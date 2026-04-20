-- Fix RLS policies for table that were missing WITH CHECK clause for INSERT operations
-- and ensure proper permissions are granted

-- 1. Leave Requests
DROP POLICY IF EXISTS "Allow all access to leave_requests" ON public.leave_requests;
CREATE POLICY "Allow all operations on leave_requests" ON public.leave_requests
    FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO anon;

-- 2. Attendance
DROP POLICY IF EXISTS "Allow all access to attendance" ON public.attendance;
CREATE POLICY "Allow all operations on attendance" ON public.attendance
    FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO anon;

-- 3. Performance Goals
DROP POLICY IF EXISTS "Allow all access to performance_goals" ON public.performance_goals;
CREATE POLICY "Allow all operations on performance_goals" ON public.performance_goals
    FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.performance_goals TO authenticated;
GRANT ALL ON public.performance_goals TO anon;

-- 4. Departments
DROP POLICY IF EXISTS "Allow all access to departments" ON public.departments;
CREATE POLICY "Allow all operations on departments" ON public.departments
    FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.departments TO authenticated;
GRANT ALL ON public.departments TO anon;

-- 5. Succession Plans
DROP POLICY IF EXISTS "Allow all access to succession_plans" ON public.succession_plans;
CREATE POLICY "Allow all operations on succession_plans" ON public.succession_plans
    FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.succession_plans TO authenticated;
GRANT ALL ON public.succession_plans TO anon;

-- 6. Payroll Cycles
DROP POLICY IF EXISTS "Allow all access to payroll_cycles" ON public.payroll_cycles;
CREATE POLICY "Allow all operations on payroll_cycles" ON public.payroll_cycles
    FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.payroll_cycles TO authenticated;
GRANT ALL ON public.payroll_cycles TO anon;
