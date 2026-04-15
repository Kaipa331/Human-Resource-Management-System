-- Clean All Dummy Data from HRMS Database
-- Run this script in Supabase SQL Editor to remove all test/sample data
-- This will prepare the system for real production data

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Clean dependent tables first (child tables)
DO $$
BEGIN
    -- 1. Clean attendance records
    DELETE FROM public.attendance;
    RAISE NOTICE 'All attendance records deleted';

    -- 2. Clean leave requests
    DELETE FROM public.leave_requests;
    RAISE NOTICE 'All leave requests deleted';

    -- 3. Clean payroll records
    DELETE FROM public.payroll;
    RAISE NOTICE 'All payroll records deleted';

    -- 4. Clean training enrollments (if exists)
    DO $$
    BEGIN
        DELETE FROM public.training_enrollments WHERE 1=1;
        RAISE NOTICE 'All training enrollments deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table training_enrollments does not exist, skipping';
    END;
    $$;

    -- 5. Clean performance goals (if exists)
    DO $$
    BEGIN
        DELETE FROM public.performance_goals WHERE 1=1;
        RAISE NOTICE 'All performance goals deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table performance_goals does not exist, skipping';
    END;
    $$;

    -- 6. Clean performance reviews
    DELETE FROM public.performance_reviews;
    RAISE NOTICE 'All performance reviews deleted';

    -- 7. Clean job applications (if exists)
    DO $$
    BEGIN
        DELETE FROM public.job_applications WHERE 1=1;
        RAISE NOTICE 'All job applications deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table job_applications does not exist, skipping';
    END;
    $$;

    -- 8. Clean succession plans
    DELETE FROM public.succession_plans;
    RAISE NOTICE 'All succession plans deleted';

    -- 9. Clean payroll cycles
    DELETE FROM public.payroll_cycles;
    RAISE NOTICE 'All payroll cycles deleted';

    -- Clean main tables (parent tables)
    -- 10. Clean employees
    DELETE FROM public.employees;
    RAISE NOTICE 'All employee records deleted';

    -- 11. Clean training courses
    DELETE FROM public.training_courses;
    RAISE NOTICE 'All training courses deleted';

    -- 12. Clean job postings
    DELETE FROM public.job_postings;
    RAISE NOTICE 'All job postings deleted';

    -- 13. Clean departments
    DELETE FROM public.departments;
    RAISE NOTICE 'All department records deleted';
END $$;

-- 14. Reset sequences (if they exist)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_default LIKE 'nextval%'
    LOOP
        EXECUTE 'ALTER TABLE public.' || table_record.table_name || ' ALTER COLUMN id RESTART WITH 1;';
    END LOOP;
    RAISE NOTICE 'All sequences reset to start from 1';
END $$;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Verify cleanup
DO $$
DECLARE
    table_count INTEGER;
    table_record RECORD;
    tables_to_check TEXT[] := ARRAY[
        'employees', 'attendance', 'leave_requests', 'payroll', 
        'training_courses', 'job_postings', 'performance_reviews',
        'departments', 'succession_plans', 'payroll_cycles'
    ];
BEGIN
    FOREACH table_record.table_name IN ARRAY tables_to_check
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM public.' || table_record.table_name INTO table_count;
        IF table_count > 0 THEN
            RAISE NOTICE 'Warning: % still has % records', table_record.table_name, table_count;
        ELSE
            RAISE NOTICE '✓ % table is empty', table_record.table_name;
        END IF;
    END LOOP;
    RAISE NOTICE '=== DUMMY DATA CLEANUP COMPLETED ===';
    RAISE NOTICE 'System is now ready for real production data';
END $$;
