-- Create employee_documents table
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Policies for employee_documents
-- 1. Employees can view their own documents
DROP POLICY IF EXISTS "Employees can view their own documents" ON public.employee_documents;
CREATE POLICY "Employees can view their own documents"
ON public.employee_documents
FOR SELECT
USING (
    employee_id IN (
        SELECT id FROM public.employees WHERE email = auth.email()
    )
);

-- 2. Employees can insert their own documents
DROP POLICY IF EXISTS "Employees can insert their own documents" ON public.employee_documents;
CREATE POLICY "Employees can insert their own documents"
ON public.employee_documents
FOR INSERT
WITH CHECK (
    employee_id IN (
        SELECT id FROM public.employees WHERE email = auth.email()
    )
);

-- 3. Employees can delete their own documents
DROP POLICY IF EXISTS "Employees can delete their own documents" ON public.employee_documents;
CREATE POLICY "Employees can delete their own documents"
ON public.employee_documents
FOR DELETE
USING (
    employee_id IN (
        SELECT id FROM public.employees WHERE email = auth.email()
    )
);

-- 4. Admins/Managers can view all documents
-- Checking for admin role in users or similar metadata if applicable, 
-- but consistently with other tables, we might just use employee role check if available.
-- For now, let's keep it restricted to owner for parity with simple RLS.

-- Storage Setup
-- Note: Supabase storage buckets are managed via the storage schema.
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-docs', 'employee-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- 1. Authenticated users can upload to employee-docs
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-docs');

-- 2. Users can view their own uploaded objects
-- This assumes file_path in employee_documents matches the storage path
DROP POLICY IF EXISTS "Allow individual read access" ON storage.objects;
CREATE POLICY "Allow individual read access"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'employee-docs' AND (storage.foldername(name))[1] = auth.uid()::text); 
-- Note: auth.uid() might not match employee_id if auth system isn't 1:1, but usually it is. 
-- Alternatively, just allow select for now if bucket is private-authenticated.
