-- Upgrade succession_plans table
ALTER TABLE public.succession_plans 
ADD COLUMN IF NOT EXISTS incumbent_grade TEXT,
ADD COLUMN IF NOT EXISTS risk_of_losing TEXT DEFAULT 'Low';

-- Create successor_details table for the Talent Matrix
CREATE TABLE IF NOT EXISTS public.successor_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.succession_plans(id) ON DELETE CASCADE,
    level TEXT NOT NULL, -- '1st', '2nd', '3rd'
    availability TEXT DEFAULT 'No',
    plan_type TEXT DEFAULT 'Internal', -- 'Internal' or 'External'
    successor_position TEXT,
    successor_name TEXT NOT NULL,
    grade TEXT,
    matrix_placement TEXT, -- e.g., 'Key Contributor', 'Professional Star'
    personality TEXT, -- e.g., 'Analyzer', 'Individualist'
    years_in_service INTEGER DEFAULT 0,
    years_in_current_role INTEGER DEFAULT 0,
    readiness TEXT, -- e.g., '<12 Months', '12-24 Months'
    development_plan TEXT,
    development_tracker TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.successor_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all access to successor_details" ON public.successor_details;

-- Create "Allow all" policy for development
CREATE POLICY "Allow all access to successor_details" 
ON public.successor_details 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.successor_details TO authenticated;
GRANT ALL ON public.successor_details TO anon;
GRANT ALL ON public.successor_details TO service_role;
