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
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all for now (Can be restricted later)
CREATE POLICY "Allow all access to employees" ON public.employees FOR ALL USING (true);

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

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to attendance" ON public.attendance FOR ALL USING (true);

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

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to leave_requests" ON public.leave_requests FOR ALL USING (true);

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

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to payroll" ON public.payroll FOR ALL USING (true);
