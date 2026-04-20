


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE,
    "clock_in" timestamp with time zone,
    "clock_out" timestamp with time zone,
    "status" "text" DEFAULT 'Present'::"text",
    "location" "text",
    "verification_status" "text" DEFAULT 'Pending'::"text",
    "within_geofence" boolean DEFAULT false,
    "latitude" double precision,
    "longitude" double precision,
    "ip_address" "text",
    "device_info" "text",
    "correction_reason" "text",
    "manual_correction_requested" boolean DEFAULT false,
    "approved_by" "text",
    "approved_at" timestamp with time zone,
    "surge_sync_status" "text" DEFAULT 'Not Synced'::"text",
    "surge_last_synced_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_attendance_exception"("p_attendance_id" "uuid", "p_approved_by" "text", "p_approved_status" "text" DEFAULT 'Present'::"text") RETURNS SETOF "public"."attendance"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
    RETURN QUERY
    UPDATE public.attendance
    SET status = p_approved_status,
        verification_status = CASE WHEN p_approved_status = 'Rejected' THEN 'Rejected' ELSE 'Approved' END,
        manual_correction_requested = FALSE,
        approved_by = p_approved_by,
        approved_at = v_now,
        updated_at = v_now
    WHERE id = p_attendance_id
    RETURNING *;
END;
$$;


ALTER FUNCTION "public"."approve_attendance_exception"("p_attendance_id" "uuid", "p_approved_by" "text", "p_approved_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clock_in_attendance"("p_employee_id" "uuid", "p_latitude" double precision DEFAULT NULL::double precision, "p_longitude" double precision DEFAULT NULL::double precision, "p_location_label" "text" DEFAULT NULL::"text", "p_ip_address" "text" DEFAULT NULL::"text", "p_device_info" "text" DEFAULT NULL::"text", "p_within_geofence" boolean DEFAULT false) RETURNS SETOF "public"."attendance"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_record public.attendance;
    v_now TIMESTAMP WITH TIME ZONE := now();
    v_status TEXT := CASE
        WHEN COALESCE(p_within_geofence, FALSE) = FALSE THEN 'Needs Review'
        WHEN EXTRACT(HOUR FROM (v_now AT TIME ZONE 'Africa/Blantyre')) >= 9 THEN 'Late'
        ELSE 'Present'
    END;
BEGIN
    SELECT *
    INTO v_record
    FROM public.attendance
    WHERE employee_id = p_employee_id
      AND date = CURRENT_DATE
    ORDER BY clock_in DESC NULLS LAST
    LIMIT 1;

    IF v_record.id IS NOT NULL THEN
        RETURN QUERY
        UPDATE public.attendance
        SET clock_in = COALESCE(v_record.clock_in, v_now),
            status = CASE WHEN v_record.status = 'Correction Pending' THEN 'Correction Pending' ELSE v_status END,
            location = COALESCE(p_location_label, v_record.location),
            verification_status = CASE WHEN COALESCE(p_within_geofence, FALSE) THEN 'Verified' ELSE 'Needs Review' END,
            latitude = p_latitude,
            longitude = p_longitude,
            ip_address = p_ip_address,
            device_info = p_device_info,
            within_geofence = COALESCE(p_within_geofence, FALSE),
            manual_correction_requested = FALSE,
            updated_at = v_now
        WHERE id = v_record.id
        RETURNING *;
    ELSE
        RETURN QUERY
        INSERT INTO public.attendance (
            employee_id,
            date,
            clock_in,
            status,
            location,
            verification_status,
            latitude,
            longitude,
            ip_address,
            device_info,
            within_geofence,
            updated_at
        )
        VALUES (
            p_employee_id,
            CURRENT_DATE,
            v_now,
            v_status,
            COALESCE(p_location_label, 'Verification pending'),
            CASE WHEN COALESCE(p_within_geofence, FALSE) THEN 'Verified' ELSE 'Needs Review' END,
            p_latitude,
            p_longitude,
            p_ip_address,
            p_device_info,
            COALESCE(p_within_geofence, FALSE),
            v_now
        )
        RETURNING *;
    END IF;
END;
$$;


ALTER FUNCTION "public"."clock_in_attendance"("p_employee_id" "uuid", "p_latitude" double precision, "p_longitude" double precision, "p_location_label" "text", "p_ip_address" "text", "p_device_info" "text", "p_within_geofence" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clock_out_attendance"("p_attendance_id" "uuid", "p_latitude" double precision DEFAULT NULL::double precision, "p_longitude" double precision DEFAULT NULL::double precision, "p_location_label" "text" DEFAULT NULL::"text", "p_ip_address" "text" DEFAULT NULL::"text", "p_device_info" "text" DEFAULT NULL::"text", "p_within_geofence" boolean DEFAULT false) RETURNS SETOF "public"."attendance"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
    RETURN QUERY
    UPDATE public.attendance
    SET clock_out = v_now,
        location = COALESCE(p_location_label, location),
        verification_status = CASE WHEN COALESCE(p_within_geofence, FALSE) THEN COALESCE(verification_status, 'Verified') ELSE 'Needs Review' END,
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        ip_address = COALESCE(p_ip_address, ip_address),
        device_info = COALESCE(p_device_info, device_info),
        within_geofence = COALESCE(p_within_geofence, within_geofence),
        status = CASE
            WHEN status = 'Correction Pending' THEN status
            WHEN COALESCE(p_within_geofence, FALSE) = FALSE THEN 'Needs Review'
            ELSE status
        END,
        updated_at = v_now
    WHERE id = p_attendance_id
    RETURNING *;
END;
$$;


ALTER FUNCTION "public"."clock_out_attendance"("p_attendance_id" "uuid", "p_latitude" double precision, "p_longitude" double precision, "p_location_label" "text", "p_ip_address" "text", "p_device_info" "text", "p_within_geofence" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_employee_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT employee_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."get_current_employee_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_hr"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'HR')
  );
END;
$$;


ALTER FUNCTION "public"."is_admin_or_hr"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "head_of_department" "text" NOT NULL,
    "head_image_url" "text",
    "employee_count" integer DEFAULT 0,
    "budget_utilization" integer DEFAULT 0,
    "status" "text" DEFAULT 'STABLE'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "department" "text" NOT NULL,
    "position" "text",
    "status" "text" DEFAULT 'Active'::"text",
    "join_date" "date" DEFAULT CURRENT_DATE,
    "salary" numeric,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "date_of_birth" "date",
    "gender" "text",
    "address" "text",
    "employment_type" "text",
    "manager_supervisor" "text",
    "work_location" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "emergency_contact_relationship" "text",
    "bank_name" "text",
    "bank_account_number" "text",
    "tax_id_pin" "text",
    CONSTRAINT "employees_employment_type_check" CHECK (("employment_type" = ANY (ARRAY['Full-time'::"text", 'Part-time'::"text", 'Contract'::"text", 'Intern'::"text", 'Temporary'::"text"]))),
    CONSTRAINT "employees_gender_check" CHECK (("gender" = ANY (ARRAY['Male'::"text", 'Female'::"text", 'Other'::"text", 'Prefer not to say'::"text"])))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


COMMENT ON COLUMN "public"."employees"."date_of_birth" IS 'Employee date of birth';



COMMENT ON COLUMN "public"."employees"."gender" IS 'Employee gender (Male, Female, Other, Prefer not to say)';



COMMENT ON COLUMN "public"."employees"."address" IS 'Employee residential address';



COMMENT ON COLUMN "public"."employees"."employment_type" IS 'Employment type (Full-time, Part-time, Contract, Intern, Temporary)';



COMMENT ON COLUMN "public"."employees"."manager_supervisor" IS 'Manager or supervisor name';



COMMENT ON COLUMN "public"."employees"."work_location" IS 'Primary work location';



COMMENT ON COLUMN "public"."employees"."emergency_contact_name" IS 'Emergency contact person name';



COMMENT ON COLUMN "public"."employees"."emergency_contact_phone" IS 'Emergency contact phone number';



COMMENT ON COLUMN "public"."employees"."emergency_contact_relationship" IS 'Relationship to emergency contact';



COMMENT ON COLUMN "public"."employees"."bank_name" IS 'Bank name for payroll';



COMMENT ON COLUMN "public"."employees"."bank_account_number" IS 'Bank account number for salary deposits';



COMMENT ON COLUMN "public"."employees"."tax_id_pin" IS 'Tax ID or PIN for tax purposes';



CREATE TABLE IF NOT EXISTS "public"."job_applicants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "position" "text" NOT NULL,
    "experience" "text",
    "status" "text" DEFAULT 'New'::"text",
    "applied_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."job_applicants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_postings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "department" "text" NOT NULL,
    "location" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "applicants" integer DEFAULT 0,
    "status" "text" DEFAULT 'Open'::"text",
    "posted_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."job_postings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'Pending'::"text"
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "cycle_id" "uuid",
    "pay_period" character varying(50) NOT NULL,
    "base_salary" numeric(10,2) DEFAULT 0 NOT NULL,
    "housing_allowance" numeric(10,2) DEFAULT 0,
    "transport_allowance" numeric(10,2) DEFAULT 0,
    "meal_allowance" numeric(10,2) DEFAULT 0,
    "other_allowances" numeric(10,2) DEFAULT 0,
    "paye_tax" numeric(10,2) DEFAULT 0,
    "pension_contrib" numeric(10,2) DEFAULT 0,
    "health_insurance" numeric(10,2) DEFAULT 0,
    "other_deductions" numeric(10,2) DEFAULT 0,
    "overtime_hours" numeric(5,2) DEFAULT 0,
    "overtime_rate" numeric(5,2) DEFAULT 0,
    "overtime_pay" numeric(10,2) DEFAULT 0,
    "performance_bonus" numeric(10,2) DEFAULT 0,
    "other_bonus" numeric(10,2) DEFAULT 0,
    "gross_salary" numeric(10,2) DEFAULT 0,
    "total_deductions" numeric(10,2) DEFAULT 0,
    "net_salary" numeric(10,2) DEFAULT 0,
    "pay_date" "date",
    "payment_status" character varying(20) DEFAULT 'Pending'::character varying,
    "bank_reference" character varying(100),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['Pending'::character varying, 'Processed'::character varying, 'Failed'::character varying, 'Cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."payroll" OWNER TO "postgres";


COMMENT ON TABLE "public"."payroll" IS 'Individual employee payroll records with detailed compensation';



CREATE TABLE IF NOT EXISTS "public"."payroll_cycles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cycle_name" character varying(100) NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" character varying(20) DEFAULT 'Draft'::character varying,
    "total_employees" integer DEFAULT 0,
    "total_gross" numeric(12,2) DEFAULT 0,
    "total_net" numeric(12,2) DEFAULT 0,
    "total_tax" numeric(12,2) DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_cycles_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Draft'::character varying, 'Processing'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."payroll_cycles" OWNER TO "postgres";


COMMENT ON TABLE "public"."payroll_cycles" IS 'Payroll processing cycles for batch payroll runs';



CREATE TABLE IF NOT EXISTS "public"."performance_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "progress" integer DEFAULT 0,
    "status" "text" DEFAULT 'Not Started'::"text",
    "start_date" "date" DEFAULT CURRENT_DATE,
    "due_date" "date",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."performance_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "reviewer_id" "uuid",
    "review_period" character varying(50) NOT NULL,
    "review_type" character varying(30) DEFAULT 'Quarterly'::character varying,
    "quality_of_work" numeric(3,2),
    "productivity" numeric(3,2),
    "teamwork" numeric(3,2),
    "communication" numeric(3,2),
    "initiative" numeric(3,2),
    "attendance" numeric(3,2),
    "overall_rating" numeric(3,2),
    "strengths" "text",
    "areas_for_improvement" "text",
    "goals" "text",
    "employee_comments" "text",
    "reviewer_comments" "text",
    "status" character varying(20) DEFAULT 'Draft'::character varying,
    "review_date" "date",
    "next_review_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "performance_reviews_attendance_check" CHECK ((("attendance" >= (1)::numeric) AND ("attendance" <= (5)::numeric))),
    CONSTRAINT "performance_reviews_communication_check" CHECK ((("communication" >= (1)::numeric) AND ("communication" <= (5)::numeric))),
    CONSTRAINT "performance_reviews_initiative_check" CHECK ((("initiative" >= (1)::numeric) AND ("initiative" <= (5)::numeric))),
    CONSTRAINT "performance_reviews_overall_rating_check" CHECK ((("overall_rating" >= (1)::numeric) AND ("overall_rating" <= (5)::numeric))),
    CONSTRAINT "performance_reviews_productivity_check" CHECK ((("productivity" >= (1)::numeric) AND ("productivity" <= (5)::numeric))),
    CONSTRAINT "performance_reviews_quality_of_work_check" CHECK ((("quality_of_work" >= (1)::numeric) AND ("quality_of_work" <= (5)::numeric))),
    CONSTRAINT "performance_reviews_review_type_check" CHECK ((("review_type")::"text" = ANY ((ARRAY['Monthly'::character varying, 'Quarterly'::character varying, 'Annual'::character varying, 'Probation'::character varying])::"text"[]))),
    CONSTRAINT "performance_reviews_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Draft'::character varying, 'Submitted'::character varying, 'Reviewed'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::"text"[]))),
    CONSTRAINT "performance_reviews_teamwork_check" CHECK ((("teamwork" >= (1)::numeric) AND ("teamwork" <= (5)::numeric)))
);


ALTER TABLE "public"."performance_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."performance_reviews" IS 'Employee performance evaluation records';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'Employee'::"text" NOT NULL,
    "employee_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_name" character varying(100) NOT NULL,
    "report_type" character varying(50) NOT NULL,
    "frequency" character varying(20) DEFAULT 'Monthly'::character varying,
    "recipients" "text"[],
    "parameters" "jsonb",
    "is_active" boolean DEFAULT true,
    "last_run" timestamp with time zone,
    "next_run" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "report_schedules_frequency_check" CHECK ((("frequency")::"text" = ANY ((ARRAY['Daily'::character varying, 'Weekly'::character varying, 'Monthly'::character varying, 'Quarterly'::character varying, 'Annually'::character varying])::"text"[])))
);


ALTER TABLE "public"."report_schedules" OWNER TO "postgres";


COMMENT ON TABLE "public"."report_schedules" IS 'Automated report generation schedules';



CREATE TABLE IF NOT EXISTS "public"."training_certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "employee_id" "uuid",
    "issued_on" "date" DEFAULT CURRENT_DATE
);


ALTER TABLE "public"."training_certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_name" character varying(200) NOT NULL,
    "course_code" character varying(50),
    "description" "text",
    "category" character varying(50),
    "duration_hours" integer,
    "cost" numeric(10,2) DEFAULT 0,
    "instructor" character varying(100),
    "status" character varying(20) DEFAULT 'Active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "training_courses_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying, 'Archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."training_courses" OWNER TO "postgres";


COMMENT ON TABLE "public"."training_courses" IS 'Available training courses catalog';



CREATE TABLE IF NOT EXISTS "public"."training_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "course_id" "uuid",
    "enrollment_date" "date" DEFAULT CURRENT_DATE,
    "completion_date" "date",
    "status" character varying(20) DEFAULT 'Enrolled'::character varying,
    "score" numeric(5,2),
    "certificate_issued" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "training_enrollments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['Enrolled'::character varying, 'In Progress'::character varying, 'Completed'::character varying, 'Dropped'::character varying, 'Failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."training_enrollments" OWNER TO "postgres";


COMMENT ON TABLE "public"."training_enrollments" IS 'Employee training enrollment and completion records';



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_applicants"
    ADD CONSTRAINT "job_applicants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_postings"
    ADD CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_schedules"
    ADD CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_certificates"
    ADD CONSTRAINT "training_certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_courses"
    ADD CONSTRAINT "training_courses_course_code_key" UNIQUE ("course_code");



ALTER TABLE ONLY "public"."training_courses"
    ADD CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_enrollments"
    ADD CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_attendance_employee_date" ON "public"."attendance" USING "btree" ("employee_id", "date" DESC);



CREATE INDEX "idx_employees_employment_type" ON "public"."employees" USING "btree" ("employment_type");



CREATE INDEX "idx_employees_gender" ON "public"."employees" USING "btree" ("gender");



CREATE INDEX "idx_employees_manager" ON "public"."employees" USING "btree" ("manager_supervisor");



CREATE INDEX "idx_employees_work_location" ON "public"."employees" USING "btree" ("work_location");



CREATE INDEX "idx_payroll_cycle_id" ON "public"."payroll" USING "btree" ("cycle_id");



CREATE INDEX "idx_payroll_employee_id" ON "public"."payroll" USING "btree" ("employee_id");



CREATE INDEX "idx_payroll_pay_date" ON "public"."payroll" USING "btree" ("pay_date");



CREATE INDEX "idx_payroll_status" ON "public"."payroll" USING "btree" ("payment_status");



CREATE INDEX "idx_performance_employee_id" ON "public"."performance_reviews" USING "btree" ("employee_id");



CREATE INDEX "idx_performance_period" ON "public"."performance_reviews" USING "btree" ("review_period");



CREATE INDEX "idx_performance_reviewer_id" ON "public"."performance_reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_performance_status" ON "public"."performance_reviews" USING "btree" ("status");



CREATE INDEX "idx_training_course_id" ON "public"."training_enrollments" USING "btree" ("course_id");



CREATE INDEX "idx_training_employee_id" ON "public"."training_enrollments" USING "btree" ("employee_id");



CREATE INDEX "idx_training_status" ON "public"."training_enrollments" USING "btree" ("status");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applicants"
    ADD CONSTRAINT "job_applicants_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_certificates"
    ADD CONSTRAINT "training_certificates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_enrollments"
    ADD CONSTRAINT "training_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_enrollments"
    ADD CONSTRAINT "training_enrollments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and HR and Managers can update leave requests" ON "public"."leave_requests" FOR UPDATE USING (("public"."is_admin_or_hr"() OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'Manager'::"text"))))));



CREATE POLICY "Admins and HR can insert certificates" ON "public"."training_certificates" FOR INSERT WITH CHECK ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can insert employees" ON "public"."employees" FOR INSERT WITH CHECK ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can manage applicants" ON "public"."job_applicants" USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can manage departments" ON "public"."departments" USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can manage goals" ON "public"."performance_goals" USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can manage job postings" ON "public"."job_postings" USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can update attendance" ON "public"."attendance" FOR UPDATE USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can update employees" ON "public"."employees" FOR UPDATE USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can update profiles" ON "public"."profiles" FOR UPDATE USING (("public"."is_admin_or_hr"() OR ("id" = "auth"."uid"())));



CREATE POLICY "Admins and HR can view all applicants" ON "public"."job_applicants" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can view all attendance" ON "public"."attendance" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can view all certificates" ON "public"."training_certificates" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can view all goals" ON "public"."performance_goals" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can view all job postings" ON "public"."job_postings" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can view all leave requests" ON "public"."leave_requests" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins and HR can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins can delete employees" ON "public"."employees" FOR DELETE USING (("public"."get_user_role"() = 'Admin'::"text"));



CREATE POLICY "Admins can delete profiles" ON "public"."profiles" FOR DELETE USING (("public"."get_user_role"() = 'Admin'::"text"));



CREATE POLICY "Admins can insert profiles" ON "public"."profiles" FOR INSERT WITH CHECK (("public"."get_user_role"() = 'Admin'::"text"));



CREATE POLICY "Admins can view all employees" ON "public"."employees" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "All authenticated users can view departments" ON "public"."departments" FOR SELECT USING (true);



CREATE POLICY "All authenticated users can view open job postings" ON "public"."job_postings" FOR SELECT USING (("status" = 'Open'::"text"));



CREATE POLICY "Allow all access to job_applicants" ON "public"."job_applicants" USING (true);



CREATE POLICY "Allow all access to training_certificates" ON "public"."training_certificates" USING (true);



CREATE POLICY "Allow all operations on employees" ON "public"."employees" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on profiles" ON "public"."profiles" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to view payroll" ON "public"."payroll" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view performance reviews" ON "public"."performance_reviews" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view training" ON "public"."training_courses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view training enrollments" ON "public"."training_enrollments" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Employees can insert their own attendance" ON "public"."attendance" FOR INSERT WITH CHECK (("employee_id" = "public"."get_current_employee_id"()));



CREATE POLICY "Employees can insert their own leave requests" ON "public"."leave_requests" FOR INSERT WITH CHECK (("employee_id" = "public"."get_current_employee_id"()));



CREATE POLICY "Employees can update their own goals" ON "public"."performance_goals" FOR UPDATE USING (("employee_id" = "public"."get_current_employee_id"()));



CREATE POLICY "Employees can view their own attendance" ON "public"."attendance" FOR SELECT USING (("employee_id" = "public"."get_current_employee_id"()));



CREATE POLICY "Employees can view their own certificates" ON "public"."training_certificates" FOR SELECT USING (("employee_id" = "public"."get_current_employee_id"()));



CREATE POLICY "Employees can view their own goals" ON "public"."performance_goals" FOR SELECT USING (("employee_id" = "public"."get_current_employee_id"()));



CREATE POLICY "Employees can view their own leave requests" ON "public"."leave_requests" FOR SELECT USING (("employee_id" = "public"."get_current_employee_id"()));



CREATE POLICY "Employees can view their own record" ON "public"."employees" FOR SELECT USING (("id" = "public"."get_current_employee_id"()));



CREATE POLICY "Managers can view department attendance" ON "public"."attendance" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "e"
     JOIN "public"."profiles" "p" ON (("p"."employee_id" = "e"."id")))
  WHERE (("e"."id" = "attendance"."employee_id") AND ("e"."department" = ( SELECT "e2"."department"
           FROM "public"."employees" "e2"
          WHERE (("e2"."id" = "p"."employee_id") AND ("p"."role" = 'Manager'::"text"))))))));



CREATE POLICY "Managers can view department employees" ON "public"."employees" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'Manager'::"text") AND ("p"."employee_id" IN ( SELECT "e2"."id"
           FROM "public"."employees" "e2"
          WHERE (("e2"."department" = "employees"."department") AND ("e2"."position" ~~ '%Manager%'::"text"))))))));



CREATE POLICY "Managers can view department leave requests" ON "public"."leave_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "e"
     JOIN "public"."profiles" "p" ON (("p"."employee_id" = "e"."id")))
  WHERE (("e"."id" = "leave_requests"."employee_id") AND ("e"."department" = ( SELECT "e2"."department"
           FROM "public"."employees" "e2"
          WHERE (("e2"."id" = "p"."employee_id") AND ("p"."role" = 'Manager'::"text"))))))));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_applicants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_postings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_cycles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_enrollments" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_attendance_exception"("p_attendance_id" "uuid", "p_approved_by" "text", "p_approved_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_attendance_exception"("p_attendance_id" "uuid", "p_approved_by" "text", "p_approved_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_attendance_exception"("p_attendance_id" "uuid", "p_approved_by" "text", "p_approved_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."clock_in_attendance"("p_employee_id" "uuid", "p_latitude" double precision, "p_longitude" double precision, "p_location_label" "text", "p_ip_address" "text", "p_device_info" "text", "p_within_geofence" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."clock_in_attendance"("p_employee_id" "uuid", "p_latitude" double precision, "p_longitude" double precision, "p_location_label" "text", "p_ip_address" "text", "p_device_info" "text", "p_within_geofence" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."clock_in_attendance"("p_employee_id" "uuid", "p_latitude" double precision, "p_longitude" double precision, "p_location_label" "text", "p_ip_address" "text", "p_device_info" "text", "p_within_geofence" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."clock_out_attendance"("p_attendance_id" "uuid", "p_latitude" double precision, "p_longitude" double precision, "p_location_label" "text", "p_ip_address" "text", "p_device_info" "text", "p_within_geofence" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."clock_out_attendance"("p_attendance_id" "uuid", "p_latitude" double precision, "p_longitude" double precision, "p_location_label" "text", "p_ip_address" "text", "p_device_info" "text", "p_within_geofence" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."clock_out_attendance"("p_attendance_id" "uuid", "p_latitude" double precision, "p_longitude" double precision, "p_location_label" "text", "p_ip_address" "text", "p_device_info" "text", "p_within_geofence" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_employee_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_employee_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_employee_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_hr"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_hr"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_hr"() TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."job_applicants" TO "anon";
GRANT ALL ON TABLE "public"."job_applicants" TO "authenticated";
GRANT ALL ON TABLE "public"."job_applicants" TO "service_role";



GRANT ALL ON TABLE "public"."job_postings" TO "anon";
GRANT ALL ON TABLE "public"."job_postings" TO "authenticated";
GRANT ALL ON TABLE "public"."job_postings" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "anon";
GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";



GRANT ALL ON TABLE "public"."payroll" TO "anon";
GRANT ALL ON TABLE "public"."payroll" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_cycles" TO "anon";
GRANT ALL ON TABLE "public"."payroll_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."performance_goals" TO "anon";
GRANT ALL ON TABLE "public"."performance_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_goals" TO "service_role";



GRANT ALL ON TABLE "public"."performance_reviews" TO "anon";
GRANT ALL ON TABLE "public"."performance_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."report_schedules" TO "anon";
GRANT ALL ON TABLE "public"."report_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."report_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."training_certificates" TO "anon";
GRANT ALL ON TABLE "public"."training_certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."training_certificates" TO "service_role";



GRANT ALL ON TABLE "public"."training_courses" TO "anon";
GRANT ALL ON TABLE "public"."training_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."training_courses" TO "service_role";



GRANT ALL ON TABLE "public"."training_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."training_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."training_enrollments" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







