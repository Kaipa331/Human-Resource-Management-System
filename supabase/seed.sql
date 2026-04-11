

-- Seed Training Courses
INSERT INTO public.training_courses (title, category, duration_hours, provider, status, rating, start_date, end_date)
VALUES
  ('Advanced Excel for HR Professionals', 'Technical Skills', 16, 'LinkedIn Learning', 'Active', 4.2, '2026-02-01', '2026-04-30'),
  ('Leadership Development Program', 'Leadership', 40, 'Internal Training', 'Active', 4.5, '2026-01-15', '2026-06-30'),
  ('Workplace Safety & Compliance', 'Compliance', 8, 'External Consultant', 'Active', 4.1, '2026-01-01', '2026-03-31')
ON CONFLICT DO NOTHING;


