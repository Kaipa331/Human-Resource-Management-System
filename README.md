
  # Human Resource Management System

  This is a code bundle for Human Resource Management System. The original project is available at https://www.figma.com/design/WngcpzhPkME55LaSLwQj2S/Human-Resource-Management-System.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Setup

  1. Create a Supabase project at https://supabase.com
  2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
  3. Run the seed data from `supabase/seed.sql` if needed
  4. Create a storage bucket named 'reports' in Supabase Storage with public access enabled
  5. Set environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

  ## Employee Account Creation & Login

  ### How It Works

  The system has an automatic account creation workflow:

  1. **Admin adds employee** in Employee Management page
  2. **System creates Supabase Auth account** automatically with:
     - Generated temporary password
     - Profile record linking auth user to employee role
  3. **Credentials are displayed** to admin in a secure dialog
  4. **Admin shares** email and password with employee (via secure channel)
  5. **Employee logs in** with those credentials at `/login`
  6. **Employee changes password** on first login (required by Supabase)

  ### Employee Creation Process

  **For Admins:**
  - Go to **Employees** → **Add Employee**
  - Fill in employee details (Name, Email, Email, Department, Position, Salary, Join Date)
  - Click **Add Employee**
  - A dialog shows the temporary credentials
  - Copy and securely share email + password with the employee
  - Employee uses those to log in

  ### First Login

  **For Employees:**
  1. Go to `/login`
  2. Enter email and temporary password
  3. Supabase will prompt to set a new password
  4. Create a new secure password
  5. Access the system

  ### Password Management

  **For Admins - Reset Employee Password:**
  - Go to **Employees** → Find the employee
  - Click the **Key icon** in the Actions column
  - A password reset email is sent to the employee
  - Employee clicks the link in the email to set a new password

  **For Employees - Change Own Password:**
  - Settings in Supabase dashboard or email reset link

  ## Demo Accounts (Fallback)

  If Supabase is not configured, the system has demo accounts:
  - **admin@hrms.com** / admin123 → Admin
  - **hr@hrms.com** / admin123 → HR Manager
  - **manager@hrms.com** / admin123 → Manager
  - **employee@hrms.com** / admin123 → Employee

  ## Features

  - Employee Management with automatic account creation
  - Attendance Tracking with geofencing
  - Leave Management with approval workflow
  - Payroll Processing
  - Performance Reviews
  - Recruitment
  - Training Management with enrollments
  - Reports Generation and Upload
  - Employee Self-Service Portal with training enrollment
  