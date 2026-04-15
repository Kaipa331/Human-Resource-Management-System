-- Payroll System Database Schema
-- Integrates with existing employee data structure

-- Payroll cycles for batch processing
CREATE TABLE IF NOT EXISTS payroll_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Processing', 'Completed', 'Cancelled')),
  total_employees INTEGER DEFAULT 0,
  total_gross DECIMAL(12,2) DEFAULT 0,
  total_net DECIMAL(12,2) DEFAULT 0,
  total_tax DECIMAL(12,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual payroll records
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES payroll_cycles(id) ON DELETE CASCADE,
  pay_period VARCHAR(50) NOT NULL,
  
  -- Base compensation
  base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Allowances
  housing_allowance DECIMAL(10,2) DEFAULT 0,
  transport_allowance DECIMAL(10,2) DEFAULT 0,
  meal_allowance DECIMAL(10,2) DEFAULT 0,
  other_allowances DECIMAL(10,2) DEFAULT 0,
  
  -- Deductions
  paye_tax DECIMAL(10,2) DEFAULT 0,
  pension_contrib DECIMAL(10,2) DEFAULT 0,
  health_insurance DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  
  -- Overtime
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  overtime_rate DECIMAL(5,2) DEFAULT 0,
  overtime_pay DECIMAL(10,2) DEFAULT 0,
  
  -- Bonuses and commissions
  performance_bonus DECIMAL(10,2) DEFAULT 0,
  other_bonus DECIMAL(10,2) DEFAULT 0,
  
  -- Calculated fields
  gross_salary DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) DEFAULT 0,
  net_salary DECIMAL(10,2) DEFAULT 0,
  
  -- Payment details
  pay_date DATE,
  payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Processed', 'Failed', 'Cancelled')),
  bank_reference VARCHAR(100),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Management Schema
CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES employees(id),
  review_period VARCHAR(50) NOT NULL,
  review_type VARCHAR(30) DEFAULT 'Quarterly' CHECK (review_type IN ('Monthly', 'Quarterly', 'Annual', 'Probation')),
  
  -- Performance ratings
  quality_of_work DECIMAL(3,2) CHECK (quality_of_work >= 1 AND quality_of_work <= 5),
  productivity DECIMAL(3,2) CHECK (productivity >= 1 AND productivity <= 5),
  teamwork DECIMAL(3,2) CHECK (teamwork >= 1 AND teamwork <= 5),
  communication DECIMAL(3,2) CHECK (communication >= 1 AND communication <= 5),
  initiative DECIMAL(3,2) CHECK (initiative >= 1 AND initiative <= 5),
  attendance DECIMAL(3,2) CHECK (attendance >= 1 AND attendance <= 5),
  
  -- Overall rating
  overall_rating DECIMAL(3,2) CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  -- Review content
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  employee_comments TEXT,
  reviewer_comments TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Approved', 'Rejected')),
  review_date DATE,
  next_review_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Management Schema
CREATE TABLE IF NOT EXISTS training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name VARCHAR(200) NOT NULL,
  course_code VARCHAR(50) UNIQUE,
  description TEXT,
  category VARCHAR(50),
  duration_hours INTEGER,
  cost DECIMAL(10,2) DEFAULT 0,
  instructor VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE,
  status VARCHAR(20) DEFAULT 'Enrolled' CHECK (status IN ('Enrolled', 'In Progress', 'Completed', 'Dropped', 'Failed')),
  score DECIMAL(5,2),
  certificate_issued BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports and Analytics Schema
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(100) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  frequency VARCHAR(20) DEFAULT 'Monthly' CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually')),
  recipients TEXT[], -- Array of email addresses
  parameters JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_cycle_id ON payroll(cycle_id);
CREATE INDEX IF NOT EXISTS idx_payroll_pay_date ON payroll(pay_date);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(payment_status);

CREATE INDEX IF NOT EXISTS idx_performance_employee_id ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviewer_id ON performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_performance_period ON performance_reviews(review_period);
CREATE INDEX IF NOT EXISTS idx_performance_status ON performance_reviews(status);

CREATE INDEX IF NOT EXISTS idx_training_employee_id ON training_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_course_id ON training_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_training_status ON training_enrollments(status);

-- Create RLS policies
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust as needed for your security model)
CREATE POLICY "Allow authenticated users to view payroll" ON payroll
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view performance reviews" ON performance_reviews
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view training" ON training_courses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view training enrollments" ON training_enrollments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE payroll_cycles IS 'Payroll processing cycles for batch payroll runs';
COMMENT ON TABLE payroll IS 'Individual employee payroll records with detailed compensation';
COMMENT ON TABLE performance_reviews IS 'Employee performance evaluation records';
COMMENT ON TABLE training_courses IS 'Available training courses catalog';
COMMENT ON TABLE training_enrollments IS 'Employee training enrollment and completion records';
COMMENT ON TABLE report_schedules IS 'Automated report generation schedules';

-- Initialize with sample data (optional - remove for production)
INSERT INTO training_courses (course_name, course_code, description, category, duration_hours, cost, instructor) VALUES
('Leadership Excellence', 'LEAD001', 'Advanced leadership skills for managers', 'Management', 40, 500.00, 'Dr. Sarah Johnson'),
('Communication Skills', 'COMM001', 'Effective workplace communication', 'Soft Skills', 16, 250.00, 'Michael Chen'),
('Project Management', 'PROJ001', 'Professional project management certification', 'Professional', 60, 1200.00, 'Lisa Anderson'),
('Data Analysis', 'DATA001', 'Business data analysis and reporting', 'Technical', 32, 800.00, 'James Wilson'),
('Customer Service', 'SERV001', 'Excellent customer service techniques', 'Customer Service', 24, 300.00, 'Emma Davis');

DO $$
BEGIN
    RAISE NOTICE 'Payroll and HR schema created successfully';
    RAISE NOTICE 'Tables: payroll_cycles, payroll, performance_reviews, training_courses, training_enrollments, report_schedules';
END $$;
