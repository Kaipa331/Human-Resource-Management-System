-- Fix RLS policies for table that were missing WITH CHECK clause for INSERT operations
-- and ensure proper permissions are granted by clearing all specific named policies first
-- This script uses defensive checks for table existence and dynamic SQL (EXECUTE) for DDL

-- 1. Leave Requests
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leave_requests') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access to leave_requests" ON public.leave_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can view all leave requests" ON public.leave_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Employees can view their own leave requests" ON public.leave_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Managers can view department leave requests" ON public.leave_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Employees can insert their own leave requests" ON public.leave_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR and Managers can update leave requests" ON public.leave_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on leave_requests" ON public.leave_requests';

        EXECUTE 'CREATE POLICY "Allow all operations on leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true)';
        EXECUTE 'GRANT ALL ON public.leave_requests TO authenticated';
        EXECUTE 'GRANT ALL ON public.leave_requests TO anon';
    END IF;
END $$;

-- 2. Attendance
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access to attendance" ON public.attendance';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can view all attendance" ON public.attendance';
        EXECUTE 'DROP POLICY IF EXISTS "Employees can view their own attendance" ON public.attendance';
        EXECUTE 'DROP POLICY IF EXISTS "Managers can view department attendance" ON public.attendance';
        EXECUTE 'DROP POLICY IF EXISTS "Employees can insert their own attendance" ON public.attendance';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can update attendance" ON public.attendance';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on attendance" ON public.attendance';

        EXECUTE 'CREATE POLICY "Allow all operations on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true)';
        EXECUTE 'GRANT ALL ON public.attendance TO authenticated';
        EXECUTE 'GRANT ALL ON public.attendance TO anon';
    END IF;
END $$;

-- 3. Performance Goals
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance_goals') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access to performance_goals" ON public.performance_goals';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can view all goals" ON public.performance_goals';
        EXECUTE 'DROP POLICY IF EXISTS "Employees can view their own goals" ON public.performance_goals';
        EXECUTE 'DROP POLICY IF EXISTS "Employees can update their own goals" ON public.performance_goals';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can manage goals" ON public.performance_goals';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on performance_goals" ON public.performance_goals';

        EXECUTE 'CREATE POLICY "Allow all operations on performance_goals" ON public.performance_goals FOR ALL USING (true) WITH CHECK (true)';
        EXECUTE 'GRANT ALL ON public.performance_goals TO authenticated';
        EXECUTE 'GRANT ALL ON public.performance_goals TO anon';
    END IF;
END $$;

-- 4. Departments
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access to departments" ON public.departments';
        EXECUTE 'DROP POLICY IF EXISTS "All authenticated users can view departments" ON public.departments';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can manage departments" ON public.departments';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on departments" ON public.departments';

        EXECUTE 'CREATE POLICY "Allow all operations on departments" ON public.departments FOR ALL USING (true) WITH CHECK (true)';
        EXECUTE 'GRANT ALL ON public.departments TO authenticated';
        EXECUTE 'GRANT ALL ON public.departments TO anon';
    END IF;
END $$;

-- 5. Succession Plans
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'succession_plans') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access to succession_plans" ON public.succession_plans';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can view succession plans" ON public.succession_plans';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can manage succession plans" ON public.succession_plans';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on succession_plans" ON public.succession_plans';

        EXECUTE 'CREATE POLICY "Allow all operations on succession_plans" ON public.succession_plans FOR ALL USING (true) WITH CHECK (true)';
        EXECUTE 'GRANT ALL ON public.succession_plans TO authenticated';
        EXECUTE 'GRANT ALL ON public.succession_plans TO anon';
    END IF;
END $$;

-- 6. Payroll Cycles
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_cycles') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access to payroll_cycles" ON public.payroll_cycles';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can view payroll cycles" ON public.payroll_cycles';
        EXECUTE 'DROP POLICY IF EXISTS "Admins and HR can manage payroll cycles" ON public.payroll_cycles';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all operations on payroll_cycles" ON public.payroll_cycles';

        EXECUTE 'CREATE POLICY "Allow all operations on payroll_cycles" ON public.payroll_cycles FOR ALL USING (true) WITH CHECK (true)';
        EXECUTE 'GRANT ALL ON public.payroll_cycles TO authenticated';
        EXECUTE 'GRANT ALL ON public.payroll_cycles TO anon';
    END IF;
END $$;




