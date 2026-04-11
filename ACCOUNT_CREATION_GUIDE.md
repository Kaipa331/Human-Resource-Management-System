# Employee Account Creation & Authentication Guide

## Overview

The HRMS system has a **secure, automated account creation system** that ensures employees can access the platform immediately after being added by HR administrators.

## Account Creation Workflow

```
Admin adds Employee in UI
    ↓
System creates Supabase Auth account
    ↓
Temporary password generated
    ↓
Profile record created
    ↓
Credentials shown to Admin
    ↓
Admin shares with Employee
    ↓
Employee logs in at /login
    ↓
Employee sets permanent password
    ↓
Access to HRMS granted
```

## Step-by-Step: For Administrators

### 1. Add a New Employee

**Location:** Employee Management → Add Employee

1. Click the blue **"Add Employee"** button at the top right
2. Fill in the form:
   - **Full Name**: John Doe
   - **Email**: john.doe@company.com *(Must be unique)*
   - **Phone**: +265 991 234 567
   - **Department**: IT, HR, Finance, Sales, Marketing, Operations
   - **Position**: Software Engineer, Manager, etc.
   - **Salary**: Employee's monthly salary (MWK)
   - **Join Date**: Employment start date

3. Click **"Add Employee"**

### 2. Handle New Account Credentials

After clicking Add Employee:

1. A green success dialog appears: **"Account Created Successfully"**
2. The dialog shows:
   - **Email**: john.doe@company.com
   - **Temporary Password**: (auto-generated secure password)
3. Click the copy icon next to each field to copy credentials
4. **Important**: Share these via secure channel (WhatsApp, in-person, etc.)
   - **DO NOT send via email** - passwords should not be emailed
   - **DO NOT share in Slack** or other group chats

### 3. Send to Employee

Create a message like:

```
Hello John,

Welcome to [Company Name]! Your account is ready.

Login at: https://your-domain.com/login

Temporary Credentials:
Email: john.doe@company.com
Password: [paste temporary password]

⚠️ You must change this password on first login.
```

### 4. Reset Forgotten Password

If an employee forgets their password:

1. Go to **Employees** → Find the employee
2. Click the **Key icon** (🔑) in the Actions column
3. A reset email is sent to their account
4. Employee clicks the link in the email and creates a new password

## Step-by-Step: For Employees

### First Time Login

1. Open https://your-domain.com/login
2. Enter:
   - **Email**: john.doe@company.com
   - **Password**: (temporary password from admin)
3. Click **Sign In**
4. Supabase prompts: "Set a new password"
5. Create a strong password:
   - At least 8 characters
   - Mix of uppercase, lowercase, numbers
   - Special characters recommended
6. Click **Confirm**
7. ✅ You're now logged in!

### Forgot Your Password

1. Go to login page
2. Click **"Forgot Password?"** (if available)
3. Enter your email
4. Click reset link in email
5. Create a new password
6. Log in with new password

## Technical Details

### Account Creation System (`src/lib/authService.ts`)

The system performs these operations:

1. **Generate Temporary Password**
   - 12 characters long
   - Mix of uppercase, lowercase, numbers, special characters
   - Random, cryptographically secure

2. **Create Supabase Auth User**
   - Calls `supabase.auth.signUp()`
   - Does NOT auto-confirm (requires password change)
   - Contains employee metadata (name, role)

3. **Create Profile Record**
   - Links auth user to roles (Employee, HR, Manager, Admin)
   - Stored in `public.profiles` table
   - Used for role-based access control

4. **Return Credentials**
   - Email and temporary password to admin
   - Shown in secure on-screen dialog

### Database Schema

**`auth.users`** (Supabase managed)
```sql
id: UUID (auto-generated)
email: Text (unique)
encrypted_password: Text (hashed)
email_confirmed_at: Timestamp (null on signup)
created_at: Timestamp
```

**`public.employees`** (Your table)
```sql
id: UUID (links to auth.users.id)
employee_id: TEXT (EMP001, EMP002, etc.)
name: Text
email: Text (same as auth.users.email)
department: Text
position: Text
phone: Text
salary: Numeric
status: Text (Active, Inactive, etc.)
join_date: Date
created_at: Timestamp
```

**`public.profiles`** (Your table)
```sql
id: UUID (same as auth.users.id)
email: Text (same as auth.users.email)
role: Text (Admin, HR, Manager, Employee, Inactive)
employee_id: UUID (FK to employees)
created_at: Timestamp
```

## User Roles & Permissions

### Admin
- Create/edit/delete employees
- Manage all HR functions
- Generate reports
- Approve leave
- Access all modules

### HR Manager
- View employees
- Approve leave requests
- Manage training
- Generate payroll
- Cannot delete employees

### Manager
- View team attendance
- Approve team member leave
- View performance reviews
- Cannot manage other departments

### Employee
- Self-service portal
- View own records
- Request leave
- View payslips
- Enroll in training

### Inactive
- Cannot log in
- Account preserved for audit trail

## Troubleshooting

### "Email already exists"

**Cause**: The email was already used to create an account

**Solution**:
1. Check if employee should have different email
2. If same person, use "Reset Password" feature instead
3. For duplicate emails, contact Supabase support

### "Account creation failed after adding employee"

**Cause**: Email might already exist in auth system

**Solution**:
1. Check if signup email is correct/unique
2. Verify Supabase configuration
3. Check Supabase project auth settings
4. Ensure anon key has correct permissions

### Password reset email not received

**Cause**: Email might be bouncing, in spam, or auth disabled

**Solution**:
1. Check employee's spam/junk folder
2. Verify email address with employee
3. Wait 5 minutes (email might be delayed)
4. Resend reset request
5. Check Supabase email settings

## Security Best Practices

✅ **DO:**
- Share credentials via encrypted channel
- Use strong temporary passwords (auto-generated)
- Remind employees to change password
- Use HTTPS (already secure in production)
- Enable 2FA if available
- Log all account access

❌ **DON'T:**
- Email passwords to employees
- Use simple passwords like "123456"
- Share credentials in Slack/Teams
- Reuse temporary passwords
- Store passwords in spreadsheets
- Share credentials via WhatsApp text (voice call is better)

## Admin Setup Checklist

- [ ] Supabase project created
- [ ] `schema.sql` run in SQL editor
- [ ] Environment variables configured (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Email provider configured in Supabase
- [ ] Admin account created manually
- [ ] Demo HR account created
- [ ] Reports storage bucket created
- [ ] Row Level Security (RLS) policies reviewed
- [ ] First employee added and password reset tested
- [ ] Employee login tested from clean session

## Testing the System

### Test 1: Create Employee Account

1. Add test employee: `test@example.com`
2. Verify credentials dialog appears
3. Verify email and password are displayed
4. Copy credentials

### Test 2: First Login

1. Open incognito/private window
2. Go to `/login`
3. Enter test credentials
4. Verify Supabase prompts for password change
5. Set new password
6. Verify successful login
7. Check user data in profile

### Test 3: Password Reset

1. Log out
2. Go to login
3. Find employee in admin panel
4. Click Key icon
5. Check email for reset link
6. Click link and set new password
7. Log in with new password

## Support & Advanced Configuration

For production deployment:
- Configure SMTP email for password resets
- Set up custom email templates
- Enable 2FA/MFA for admins
- Configure single sign-on (SSO) if needed
- Set password requirements
- Configure login timeout
- Enable audit logging

See Supabase documentation: https://supabase.com/docs/guides/auth
