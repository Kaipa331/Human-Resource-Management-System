-- Seed Employees
INSERT INTO public.employees (employee_id, name, email, phone, department, position, status, join_date, salary)
VALUES
  ('EMP001', 'Precious Kaipa', 'precious.kaipa@company.com', '+265 991 123 456', 'IT', 'Senior Developer', 'Active', '2023-01-15', 1200000),
  ('EMP002', 'Sarah Phiri', 'sarah.p@company.com', '+265 882 234 567', 'HR', 'HR Manager', 'Active', '2023-03-10', 950000),
  ('EMP003', 'David Banda', 'david.b@company.com', '+265 999 345 678', 'Finance', 'Accountant', 'Active', '2023-06-20', 850000),
  ('EMP004', 'Maria Chanza', 'maria.c@company.com', '+265 888 456 789', 'Sales', 'Sales Executive', 'Active', '2023-08-05', 600000),
  ('EMP005', 'Robert Mwale', 'robert.m@company.com', '+265 991 567 890', 'Operations', 'Project Coordinator', 'Active', '2023-11-12', 750000),
  ('EMP006', 'Demo Admin', 'admin@hrms.com', '+265 991 000 001', 'HR', 'Administrator', 'Active', '2024-01-10', 1500000),
  ('EMP007', 'Demo HR Manager', 'hr@hrms.com', '+265 991 000 002', 'HR', 'HR Manager', 'Active', '2024-02-12', 1200000),
  ('EMP008', 'Demo Manager', 'manager@hrms.com', '+265 991 000 003', 'Operations', 'Operations Manager', 'Active', '2024-03-15', 1100000),
  ('EMP009', 'Demo Employee', 'employee@hrms.com', '+265 991 000 004', 'IT', 'Software Engineer', 'Active', '2024-04-20', 900000)
ON CONFLICT DO NOTHING;

-- Seed Attendance for Today
DO $$
DECLARE
    emp_record RECORD;
BEGIN
    FOR emp_record IN SELECT id FROM public.employees LIMIT 4 LOOP
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
    IF emp_record.id IS NOT NULL THEN
      INSERT INTO public.leave_requests (employee_id, type, start_date, end_date, reason, status)
      VALUES (emp_record.id, 'Vacation', CURRENT_DATE + interval '5 days', CURRENT_DATE + interval '10 days', 'Family holiday', 'Pending');
    END IF;

    SELECT id INTO emp_record FROM public.employees WHERE employee_id = 'EMP005';
    IF emp_record.id IS NOT NULL THEN
      INSERT INTO public.leave_requests (employee_id, type, start_date, end_date, reason, status)
      VALUES (emp_record.id, 'Sick Leave', CURRENT_DATE - interval '2 days', CURRENT_DATE - interval '1 day', 'Fever', 'Approved');
    END IF;
END $$;

-- Seed Training Courses
INSERT INTO public.training_courses (title, category, duration_hours, provider, status, rating, start_date, end_date)
VALUES
  ('Advanced Excel for HR Professionals', 'Technical Skills', 16, 'LinkedIn Learning', 'Active', 4.2, '2026-02-01', '2026-04-30'),
  ('Leadership Development Program', 'Leadership', 40, 'Internal Training', 'Active', 4.5, '2026-01-15', '2026-06-30'),
  ('Workplace Safety & Compliance', 'Compliance', 8, 'External Consultant', 'Active', 4.1, '2026-01-01', '2026-03-31')
ON CONFLICT DO NOTHING;

-- Seed Training Enrollments and Certificates
DO $$
DECLARE
  emp1 UUID;
  emp2 UUID;
  course1 UUID;
  course2 UUID;
  course3 UUID;
BEGIN
  SELECT id INTO emp1 FROM public.employees WHERE employee_id = 'EMP001';
  SELECT id INTO emp2 FROM public.employees WHERE employee_id = 'EMP002';

  SELECT id INTO course1 FROM public.training_courses WHERE title = 'Advanced Excel for HR Professionals' LIMIT 1;
  SELECT id INTO course2 FROM public.training_courses WHERE title = 'Leadership Development Program' LIMIT 1;
  SELECT id INTO course3 FROM public.training_courses WHERE title = 'Workplace Safety & Compliance' LIMIT 1;

  IF emp1 IS NOT NULL AND course1 IS NOT NULL THEN
    INSERT INTO public.training_enrollments (course_id, employee_id, status, progress, due_date, completed_modules, total_modules)
    VALUES (course1, emp1, 'In Progress', 85, '2026-04-30', 17, 20)
    ON CONFLICT (course_id, employee_id) DO NOTHING;
  END IF;

  IF emp1 IS NOT NULL AND course3 IS NOT NULL THEN
    INSERT INTO public.training_enrollments (course_id, employee_id, status, progress, due_date, completed_modules, total_modules)
    VALUES (course3, emp1, 'Completed', 100, '2026-02-28', 6, 6)
    ON CONFLICT (course_id, employee_id) DO NOTHING;

    INSERT INTO public.training_certificates (course_id, employee_id, issued_on)
    VALUES (course3, emp1, '2026-02-28')
    ON CONFLICT DO NOTHING;
  END IF;

  IF emp2 IS NOT NULL AND course2 IS NOT NULL THEN
    INSERT INTO public.training_enrollments (course_id, employee_id, status, progress, due_date, completed_modules, total_modules)
    VALUES (course2, emp2, 'In Progress', 40, '2026-05-15', 4, 10)
    ON CONFLICT (course_id, employee_id) DO NOTHING;
  END IF;
END $$;

-- Seed role profiles (maps login emails to app roles)
DO $$
DECLARE
  admin_emp UUID;
  hr_emp UUID;
  manager_emp UUID;
  employee_emp UUID;
BEGIN
  SELECT id INTO admin_emp FROM public.employees WHERE email = 'admin@hrms.com' LIMIT 1;
  SELECT id INTO hr_emp FROM public.employees WHERE email = 'hr@hrms.com' LIMIT 1;
  SELECT id INTO manager_emp FROM public.employees WHERE email = 'manager@hrms.com' LIMIT 1;
  SELECT id INTO employee_emp FROM public.employees WHERE email = 'employee@hrms.com' LIMIT 1;

  IF admin_emp IS NOT NULL THEN
    INSERT INTO public.profiles (email, role, employee_id)
    VALUES ('admin@hrms.com', 'Admin', admin_emp)
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, employee_id = EXCLUDED.employee_id;
  END IF;

  IF hr_emp IS NOT NULL THEN
    INSERT INTO public.profiles (email, role, employee_id)
    VALUES ('hr@hrms.com', 'HR', hr_emp)
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, employee_id = EXCLUDED.employee_id;
  END IF;

  IF manager_emp IS NOT NULL THEN
    INSERT INTO public.profiles (email, role, employee_id)
    VALUES ('manager@hrms.com', 'Manager', manager_emp)
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, employee_id = EXCLUDED.employee_id;
  END IF;

  IF employee_emp IS NOT NULL THEN
    INSERT INTO public.profiles (email, role, employee_id)
    VALUES ('employee@hrms.com', 'Employee', employee_emp)
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, employee_id = EXCLUDED.employee_id;
  END IF;
END $$;
