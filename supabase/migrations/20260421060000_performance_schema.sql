-- Performance Module Schema
-- Create performance_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    review_period TEXT NOT NULL,
    review_type TEXT NOT NULL CHECK (review_type IN ('Monthly', 'Quarterly', 'Annual', 'Probation')),
    quality_of_work INTEGER DEFAULT 3,
    productivity INTEGER DEFAULT 3,
    teamwork INTEGER DEFAULT 3,
    communication INTEGER DEFAULT 3,
    initiative INTEGER DEFAULT 3,
    attendance INTEGER DEFAULT 3,
    overall_rating NUMERIC(3,2) DEFAULT 3.00,
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    employee_comments TEXT,
    reviewer_comments TEXT,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Approved', 'Rejected')),
    review_date DATE DEFAULT CURRENT_DATE,
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.performance_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    due_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;

-- Policies for performance_reviews
DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to performance_reviews" ON public.performance_reviews;
    CREATE POLICY "Allow all access to performance_reviews" ON public.performance_reviews FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policies for performance_goals
DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow all access to performance_goals" ON public.performance_goals;
    CREATE POLICY "Allow all access to performance_goals" ON public.performance_goals FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Grant permissions
GRANT ALL ON public.performance_reviews TO authenticated;
GRANT ALL ON public.performance_reviews TO anon;
GRANT ALL ON public.performance_goals TO authenticated;
GRANT ALL ON public.performance_goals TO anon;
