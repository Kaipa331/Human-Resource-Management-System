-- Create succession_plans table
CREATE TABLE IF NOT EXISTS public.succession_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    current_holder TEXT NOT NULL,
    successor_candidates TEXT[] DEFAULT '{}',
    readiness_level TEXT DEFAULT 'Emerging',
    status TEXT DEFAULT 'Open',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.succession_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all access to succession_plans" ON public.succession_plans;

-- Create "Allow all" policy for development
CREATE POLICY "Allow all access to succession_plans" 
ON public.succession_plans 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions (for dev)
GRANT ALL ON public.succession_plans TO authenticated;
GRANT ALL ON public.succession_plans TO anon;
GRANT ALL ON public.succession_plans TO service_role;
