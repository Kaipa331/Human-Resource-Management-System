-- Create Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL, -- e.g., EMP001
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    position TEXT,
    status TEXT DEFAULT 'Active',
    join_date DATE DEFAULT CURRENT_DATE,
    salary NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
DO $$ BEGIN
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create policy to allow all for now (Can be restricted later)
DO $$ BEGIN
    CREATE POLICY "Allow all access to employees" ON public.employees FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Profiles / Role Mapping Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Employee', -- Admin, HR, Manager, Employee
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to profiles" ON public.profiles FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Present',
    location TEXT
);

DO $$ BEGIN
    ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to attendance" ON public.attendance FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- Sick, Vacation, etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending' -- Pending, Approved, Rejected
);

DO $$ BEGIN
    ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to leave_requests" ON public.leave_requests FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Payroll Table
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- e.g., "March 2024"
    basics NUMERIC,
    bonuses NUMERIC DEFAULT 0,
    deductions NUMERIC DEFAULT 0,
    net_pay NUMERIC,
    status TEXT DEFAULT 'Paid'
);

DO $$ BEGIN
    ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to payroll" ON public.payroll FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Training Courses Table
CREATE TABLE IF NOT EXISTS public.training_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_hours INTEGER DEFAULT 0,
    provider TEXT,
    status TEXT DEFAULT 'Active',
    rating NUMERIC DEFAULT 0,
    start_date DATE,
    end_date DATE
);

DO $$ BEGIN
    ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to training_courses" ON public.training_courses FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Training Enrollments Table
CREATE TABLE IF NOT EXISTS public.training_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'In Progress',
    progress NUMERIC DEFAULT 0,
    due_date DATE,
    completed_modules INTEGER DEFAULT 0,
    total_modules INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (course_id, employee_id)
);

DO $$ BEGIN
    ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to training_enrollments" ON public.training_enrollments FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Training Certificates Table
CREATE TABLE IF NOT EXISTS public.training_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    issued_on DATE DEFAULT CURRENT_DATE
);

DO $$ BEGIN
    ALTER TABLE public.training_certificates ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to training_certificates" ON public.training_certificates FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;
