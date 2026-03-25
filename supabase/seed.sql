-- Seed Employees
INSERT INTO public.employees (employee_id, name, email, phone, department, position, status, join_date, salary)
VALUES 
  ('EMP001', 'Precious Kaipa', 'precious.kaipa@company.com', '+265 991 123 456', 'IT', 'Senior Developer', 'Active', '2023-01-15', 1200000),
  ('EMP002', 'Sarah Phiri', 'sarah.p@company.com', '+265 882 234 567', 'HR', 'HR Manager', 'Active', '2023-03-10', 950000),
  ('EMP003', 'David Banda', 'david.b@company.com', '+265 999 345 678', 'Finance', 'Accountant', 'Active', '2023-06-20', 850000),
  ('EMP004', 'Maria Chanza', 'maria.c@company.com', '+265 888 456 789', 'Sales', 'Sales Executive', 'Active', '2023-08-05', 600000),
  ('EMP005', 'Robert Mwale', 'robert.m@company.com', '+265 991 567 890', 'Operations', 'Project Coordinator', 'Active', '2023-11-12', 750000);

-- Seed Attendance for Today
DO $$ 
DECLARE 
    emp_record RECORD;
BEGIN
    FOR emp_record IN SELECT id FROM public.employees LIMIT 3 LOOP
        INSERT INTO public.attendance (employee_id, date, clock_in, status)
        VALUES (emp_record.id, CURRENT_DATE, (CURRENT_DATE + interval '8 hours'), 'Present');
    END LOOP;
END $$;

-- Seed Leave Requests
DO $$ 
DECLARE 
    emp_record RECORD;
BEGIN
    SELECT id INTO emp_record FROM public.employees WHERE employee_id = 'EMP004';
    INSERT INTO public.leave_requests (employee_id, type, start_date, end_date, reason, status)
    VALUES (emp_record.id, 'Vacation', CURRENT_DATE + interval '5 days', CURRENT_DATE + interval '10 days', 'Family holiday', 'Pending');
    
    SELECT id INTO emp_record FROM public.employees WHERE employee_id = 'EMP005';
    INSERT INTO public.leave_requests (employee_id, type, start_date, end_date, reason, status)
    VALUES (emp_record.id, 'Sick Leave', CURRENT_DATE - interval '2 days', CURRENT_DATE - interval '1 day', 'Fever', 'Approved');
END $$;
