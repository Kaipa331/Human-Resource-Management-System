-- Drop previous attempts at the policy
DROP POLICY IF EXISTS "Allow individual read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual delete access" ON storage.objects;

-- Create a robust policy that allows authenticated users to read documents
-- if the path starts with their employee ID.
CREATE POLICY "Allow individual read access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'employee-docs' 
    AND (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE LOWER(email) = LOWER(auth.email()) 
            AND storage.objects.name LIKE id::text || '/%'
        )
    )
);

-- Allow users to upload documents to their own folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'employee-docs' 
    AND (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE LOWER(email) = LOWER(auth.email()) 
            AND storage.objects.name LIKE id::text || '/%'
        )
    )
);

-- Allow users to delete their own documents
CREATE POLICY "Allow individual delete access"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'employee-docs' 
    AND (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE LOWER(email) = LOWER(auth.email()) 
            AND storage.objects.name LIKE id::text || '/%'
        )
    )
);

-- Note: No changes to EmployeeSelfService.tsx logic are needed as it already correctly 
-- handles the path as "uuid/filename".
