-- Fix RLS for training_courses
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.training_courses;
CREATE POLICY "Enable all access for authenticated users" ON public.training_courses
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fix RLS for training_enrollments
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.training_enrollments;
CREATE POLICY "Enable all access for authenticated users" ON public.training_enrollments
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fix RLS for training_certificates
ALTER TABLE public.training_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.training_certificates;
CREATE POLICY "Enable all access for authenticated users" ON public.training_certificates
FOR ALL TO authenticated USING (true) WITH CHECK (true);
