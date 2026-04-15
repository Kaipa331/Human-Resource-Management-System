-- Clean All Dummy Data from HRMS Database (Safe Version)
-- This script handles tables that may not exist gracefully
-- Run this in Supabase SQL Editor

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Clean all tables with proper error handling
DO $$
BEGIN
    -- Clean attendance records
    BEGIN
        DELETE FROM public.attendance WHERE 1=1;
        RAISE NOTICE '✓ All attendance records deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table attendance does not exist, skipping';
    END;

    -- Clean leave requests
    BEGIN
        DELETE FROM public.leave_requests WHERE 1=1;
        RAISE NOTICE '✓ All leave requests deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table leave_requests does not exist, skipping';
    END;

    -- Clean payroll records
    BEGIN
        DELETE FROM public.payroll WHERE 1=1;
        RAISE NOTICE '✓ All payroll records deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table payroll does not exist, skipping';
    END;

    -- Clean training courses
    BEGIN
        DELETE FROM public.training_courses WHERE 1=1;
        RAISE NOTICE '✓ All training courses deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table training_courses does not exist, skipping';
    END;

    -- Clean job postings
    BEGIN
        DELETE FROM public.job_postings WHERE 1=1;
        RAISE NOTICE '✓ All job postings deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table job_postings does not exist, skipping';
    END;

    -- Clean performance reviews
    BEGIN
        DELETE FROM public.performance_reviews WHERE 1=1;
        RAISE NOTICE '✓ All performance reviews deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table performance_reviews does not exist, skipping';
    END;

    -- Clean succession plans
    BEGIN
        DELETE FROM public.succession_plans WHERE 1=1;
        RAISE NOTICE '✓ All succession plans deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table succession_plans does not exist, skipping';
    END;

    -- Clean payroll cycles
    BEGIN
        DELETE FROM public.payroll_cycles WHERE 1=1;
        RAISE NOTICE '✓ All payroll cycles deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table payroll_cycles does not exist, skipping';
    END;

    -- Clean employees (main table)
    BEGIN
        DELETE FROM public.employees WHERE 1=1;
        RAISE NOTICE '✓ All employee records deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table employees does not exist, skipping';
    END;

    -- Clean departments
    BEGIN
        DELETE FROM public.departments WHERE 1=1;
        RAISE NOTICE '✓ All department records deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table departments does not exist, skipping';
    END;

    -- Clean optional tables that might not exist
    BEGIN
        DELETE FROM public.training_enrollments WHERE 1=1;
        RAISE NOTICE '✓ All training enrollments deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table training_enrollments does not exist, skipping';
    END;

    BEGIN
        DELETE FROM public.performance_goals WHERE 1=1;
        RAISE NOTICE '✓ All performance goals deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table performance_goals does not exist, skipping';
    END;

    BEGIN
        DELETE FROM public.job_applications WHERE 1=1;
        RAISE NOTICE '✓ All job applications deleted';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Table job_applications does not exist, skipping';
    END;

    RAISE NOTICE '=== DUMMY DATA CLEANUP COMPLETED ===';
    RAISE NOTICE 'System is now ready for real production data';
END $$;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;
