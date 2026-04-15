-- Production-Ready Row Level Security (RLS) Policies
-- These policies replace the permissive "Allow all access" policies

-- Drop existing policies (only if tables exist)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to attendance" ON public.attendance;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to leave_requests" ON public.leave_requests;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to payroll" ON public.payroll;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to training_courses" ON public.training_courses;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to job_postings" ON public.job_postings;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to performance_reviews" ON public.performance_reviews;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to performance_goals" ON public.performance_goals;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to departments" ON public.departments;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to succession_plans" ON public.succession_plans;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to payroll_cycles" ON public.payroll_cycles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Helper function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$;

-- Helper function to check if user is admin or HR
CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'HR')
  );
END;
$$;

-- Helper function to get employee ID for current user
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT employee_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$;

-- EMPLOYEES TABLE POLICIES
CREATE POLICY "Admins can view all employees" ON public.employees
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Employees can view their own record" ON public.employees
  FOR SELECT USING (
    id = get_current_employee_id()
  );

CREATE POLICY "Managers can view department employees" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'Manager'
      AND p.employee_id IN (
        SELECT id FROM public.employees e2 
        WHERE e2.department = public.employees.department
        AND e2.position LIKE '%Manager%'
      )
    )
  );

CREATE POLICY "Admins and HR can insert employees" ON public.employees
  FOR INSERT WITH CHECK (is_admin_or_hr());

CREATE POLICY "Admins and HR can update employees" ON public.employees
  FOR UPDATE USING (is_admin_or_hr());

CREATE POLICY "Admins can delete employees" ON public.employees
  FOR DELETE USING (get_user_role() = 'Admin');

-- PROFILES TABLE POLICIES
CREATE POLICY "Admins and HR can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (get_user_role() = 'Admin');

CREATE POLICY "Admins and HR can update profiles" ON public.profiles
  FOR UPDATE USING (is_admin_or_hr() OR id = auth.uid());

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (get_user_role() = 'Admin');

-- ATTENDANCE TABLE POLICIES
CREATE POLICY "Admins and HR can view all attendance" ON public.attendance
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Employees can view their own attendance" ON public.attendance
  FOR SELECT USING (employee_id = get_current_employee_id());

CREATE POLICY "Managers can view department attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.profiles p ON p.employee_id = e.id
      WHERE e.id = public.attendance.employee_id
      AND e.department = (
        SELECT department FROM public.employees e2
        WHERE e2.id = p.employee_id
        AND p.role = 'Manager'
      )
    )
  );

CREATE POLICY "Employees can insert their own attendance" ON public.attendance
  FOR INSERT WITH CHECK (employee_id = get_current_employee_id());

CREATE POLICY "Admins and HR can update attendance" ON public.attendance
  FOR UPDATE USING (is_admin_or_hr());

-- LEAVE REQUESTS TABLE POLICIES
CREATE POLICY "Admins and HR can view all leave requests" ON public.leave_requests
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Employees can view their own leave requests" ON public.leave_requests
  FOR SELECT USING (employee_id = get_current_employee_id());

CREATE POLICY "Managers can view department leave requests" ON public.leave_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.profiles p ON p.employee_id = e.id
      WHERE e.id = public.leave_requests.employee_id
      AND e.department = (
        SELECT department FROM public.employees e2
        WHERE e2.id = p.employee_id
        AND p.role = 'Manager'
      )
    )
  );

CREATE POLICY "Employees can insert their own leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (employee_id = get_current_employee_id());

CREATE POLICY "Admins and HR and Managers can update leave requests" ON public.leave_requests
  FOR UPDATE USING (
    is_admin_or_hr() OR 
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'Manager'
    )
  );

-- PAYROLL TABLE POLICIES
CREATE POLICY "Admins and HR can view all payroll" ON public.payroll
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Employees can view their own payroll" ON public.payroll
  FOR SELECT USING (employee_id = get_current_employee_id());

CREATE POLICY "Admins and HR can insert payroll" ON public.payroll
  FOR INSERT WITH CHECK (is_admin_or_hr());

CREATE POLICY "Admins and HR can update payroll" ON public.payroll
  FOR UPDATE USING (is_admin_or_hr());

-- TRAINING COURSES TABLE POLICIES
CREATE POLICY "All authenticated users can view active courses" ON public.training_courses
  FOR SELECT USING (status = 'Active');

CREATE POLICY "Admins and HR can view all courses" ON public.training_courses
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Admins and HR can insert courses" ON public.training_courses
  FOR INSERT WITH CHECK (is_admin_or_hr());

CREATE POLICY "Admins and HR can update courses" ON public.training_courses
  FOR UPDATE USING (is_admin_or_hr());

-- TRAINING ENROLLMENTS TABLE POLICIES
CREATE POLICY "Admins and HR can view all enrollments" ON public.training_enrollments
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Employees can view their own enrollments" ON public.training_enrollments
  FOR SELECT USING (employee_id = get_current_employee_id());

CREATE POLICY "Employees can enroll themselves" ON public.training_enrollments
  FOR INSERT WITH CHECK (employee_id = get_current_employee_id());

CREATE POLICY "Admins and HR can update enrollments" ON public.training_enrollments
  FOR UPDATE USING (is_admin_or_hr());

-- TRAINING CERTIFICATES TABLE POLICIES
CREATE POLICY "Admins and HR can view all certificates" ON public.training_certificates
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Employees can view their own certificates" ON public.training_certificates
  FOR SELECT USING (employee_id = get_current_employee_id());

CREATE POLICY "Admins and HR can insert certificates" ON public.training_certificates
  FOR INSERT WITH CHECK (is_admin_or_hr());

-- JOB POSTINGS TABLE POLICIES
CREATE POLICY "All authenticated users can view open job postings" ON public.job_postings
  FOR SELECT USING (status = 'Open');

CREATE POLICY "Admins and HR can view all job postings" ON public.job_postings
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Admins and HR can manage job postings" ON public.job_postings
  FOR ALL USING (is_admin_or_hr());

-- JOB APPLICANTS TABLE POLICIES
CREATE POLICY "Admins and HR can view all applicants" ON public.job_applicants
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Admins and HR can manage applicants" ON public.job_applicants
  FOR ALL USING (is_admin_or_hr());

-- PERFORMANCE REVIEWS TABLE POLICIES
CREATE POLICY "Admins and HR can view all reviews" ON public.performance_reviews
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Employees can view their own reviews" ON public.performance_reviews
  FOR SELECT USING (employee_id = get_current_employee_id());

CREATE POLICY "Admins and HR can manage reviews" ON public.performance_reviews
  FOR ALL USING (is_admin_or_hr());

-- PERFORMANCE GOALS TABLE POLICIES
CREATE POLICY "Admins and HR can view all goals" ON public.performance_goals
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Employees can view their own goals" ON public.performance_goals
  FOR SELECT USING (employee_id = get_current_employee_id());

CREATE POLICY "Employees can update their own goals" ON public.performance_goals
  FOR UPDATE USING (employee_id = get_current_employee_id());

CREATE POLICY "Admins and HR can manage goals" ON public.performance_goals
  FOR ALL USING (is_admin_or_hr());

-- DEPARTMENTS TABLE POLICIES
CREATE POLICY "All authenticated users can view departments" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "Admins and HR can manage departments" ON public.departments
  FOR ALL USING (is_admin_or_hr());

-- SUCCESSION PLANS TABLE POLICIES
DO $$ BEGIN
    CREATE POLICY "Admins and HR can view succession plans" ON public.succession_plans
      FOR SELECT USING (is_admin_or_hr());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins and HR can manage succession plans" ON public.succession_plans
      FOR ALL USING (is_admin_or_hr());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- PAYROLL CYCLES TABLE POLICIES
CREATE POLICY "Admins and HR can view payroll cycles" ON public.payroll_cycles
  FOR SELECT USING (is_admin_or_hr());

CREATE POLICY "Admins and HR can manage payroll cycles" ON public.payroll_cycles
  FOR ALL USING (is_admin_or_hr());
