-- Add department column to performance_goals
ALTER TABLE public.performance_goals 
ADD COLUMN IF NOT EXISTS department TEXT;
