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

-- Attendance verification upgrades
ALTER TABLE public.attendance
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS within_geofence BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS ip_address TEXT,
    ADD COLUMN IF NOT EXISTS device_info TEXT,
    ADD COLUMN IF NOT EXISTS correction_reason TEXT,
    ADD COLUMN IF NOT EXISTS manual_correction_requested BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS approved_by TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS surge_sync_status TEXT DEFAULT 'Not Synced',
    ADD COLUMN IF NOT EXISTS surge_last_synced_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance (employee_id, date DESC);

CREATE OR REPLACE FUNCTION public.clock_in_attendance(
    p_employee_id UUID,
    p_latitude DOUBLE PRECISION DEFAULT NULL,
    p_longitude DOUBLE PRECISION DEFAULT NULL,
    p_location_label TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_device_info TEXT DEFAULT NULL,
    p_within_geofence BOOLEAN DEFAULT FALSE
)
RETURNS SETOF public.attendance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record public.attendance;
    v_now TIMESTAMP WITH TIME ZONE := now();
    v_status TEXT := CASE
        WHEN COALESCE(p_within_geofence, FALSE) = FALSE THEN 'Needs Review'
        WHEN EXTRACT(HOUR FROM (v_now AT TIME ZONE 'Africa/Blantyre')) >= 9 THEN 'Late'
        ELSE 'Present'
    END;
BEGIN
    SELECT *
    INTO v_record
    FROM public.attendance
    WHERE employee_id = p_employee_id
      AND date = CURRENT_DATE
    ORDER BY clock_in DESC NULLS LAST
    LIMIT 1;

    IF v_record.id IS NOT NULL THEN
        RETURN QUERY
        UPDATE public.attendance
        SET clock_in = COALESCE(v_record.clock_in, v_now),
            status = CASE WHEN v_record.status = 'Correction Pending' THEN 'Correction Pending' ELSE v_status END,
            location = COALESCE(p_location_label, v_record.location),
            verification_status = CASE WHEN COALESCE(p_within_geofence, FALSE) THEN 'Verified' ELSE 'Needs Review' END,
            latitude = p_latitude,
            longitude = p_longitude,
            ip_address = p_ip_address,
            device_info = p_device_info,
            within_geofence = COALESCE(p_within_geofence, FALSE),
            manual_correction_requested = FALSE,
            updated_at = v_now
        WHERE id = v_record.id
        RETURNING *;
    ELSE
        RETURN QUERY
        INSERT INTO public.attendance (
            employee_id,
            date,
            clock_in,
            status,
            location,
            verification_status,
            latitude,
            longitude,
            ip_address,
            device_info,
            within_geofence,
            updated_at
        )
        VALUES (
            p_employee_id,
            CURRENT_DATE,
            v_now,
            v_status,
            COALESCE(p_location_label, 'Verification pending'),
            CASE WHEN COALESCE(p_within_geofence, FALSE) THEN 'Verified' ELSE 'Needs Review' END,
            p_latitude,
            p_longitude,
            p_ip_address,
            p_device_info,
            COALESCE(p_within_geofence, FALSE),
            v_now
        )
        RETURNING *;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.clock_out_attendance(
    p_attendance_id UUID,
    p_latitude DOUBLE PRECISION DEFAULT NULL,
    p_longitude DOUBLE PRECISION DEFAULT NULL,
    p_location_label TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_device_info TEXT DEFAULT NULL,
    p_within_geofence BOOLEAN DEFAULT FALSE
)
RETURNS SETOF public.attendance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
    RETURN QUERY
    UPDATE public.attendance
    SET clock_out = v_now,
        location = COALESCE(p_location_label, location),
        verification_status = CASE WHEN COALESCE(p_within_geofence, FALSE) THEN COALESCE(verification_status, 'Verified') ELSE 'Needs Review' END,
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        ip_address = COALESCE(p_ip_address, ip_address),
        device_info = COALESCE(p_device_info, device_info),
        within_geofence = COALESCE(p_within_geofence, within_geofence),
        status = CASE
            WHEN status = 'Correction Pending' THEN status
            WHEN COALESCE(p_within_geofence, FALSE) = FALSE THEN 'Needs Review'
            ELSE status
        END,
        updated_at = v_now
    WHERE id = p_attendance_id
    RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_attendance_exception(
    p_attendance_id UUID,
    p_approved_by TEXT,
    p_approved_status TEXT DEFAULT 'Present'
)
RETURNS SETOF public.attendance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
    RETURN QUERY
    UPDATE public.attendance
    SET status = p_approved_status,
        verification_status = CASE WHEN p_approved_status = 'Rejected' THEN 'Rejected' ELSE 'Approved' END,
        manual_correction_requested = FALSE,
        approved_by = p_approved_by,
        approved_at = v_now,
        updated_at = v_now
    WHERE id = p_attendance_id
    RETURNING *;
END;
$$;

-- Job Postings Table
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    applicants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Open',
    posted_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to job_postings" ON public.job_postings FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Job Applicants Table
CREATE TABLE IF NOT EXISTS public.job_applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    experience TEXT,
    status TEXT DEFAULT 'New',
    applied_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.job_applicants ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to job_applicants" ON public.job_applicants FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    reviewer TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    overall_rating NUMERIC,
    goals INTEGER DEFAULT 0,
    achieved_goals INTEGER DEFAULT 0,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to performance_reviews" ON public.performance_reviews FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Performance Goals Table
CREATE TABLE IF NOT EXISTS public.performance_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Not Started',
    start_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to performance_goals" ON public.performance_goals FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    head_of_department TEXT NOT NULL,
    head_image_url TEXT,
    employee_count INTEGER DEFAULT 0,
    budget_utilization INTEGER DEFAULT 0,
    status TEXT DEFAULT 'STABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to departments" ON public.departments FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Payroll Cycles Table
CREATE TABLE IF NOT EXISTS public.payroll_cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'In Progress',
    total_employees INTEGER DEFAULT 0,
    total_gross NUMERIC DEFAULT 0,
    total_net NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.payroll_cycles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all access to payroll_cycles" ON public.payroll_cycles FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Update Payroll Table to reference cycles
ALTER TABLE public.payroll
    ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS gross_salary NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_deduction NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update Training Courses with additional fields
ALTER TABLE public.training_courses
    ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
