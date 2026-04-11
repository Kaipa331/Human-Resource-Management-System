# Account Creation System: Technical Architecture

## How Employees Get Accounts

The system uses **Supabase Auth** for authentication integrated with your database. Here's the complete flow:

## Authentication Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
├──────────────────────┬──────────────────────────────────────┤
│  auth.users          │  public tables                        │
│  (Managed by         │  (Managed by you)                    │
│   Supabase)          │                                       │
│                      │                                       │
│ - id (UUID)          │  profiles:                           │
│ - email              │  - id (FK auth.users)                │
│ - password (hash)    │  - email (same as auth.users)        │
│ - created_at         │  - role (Admin/HR/Manager/Employee)  │
│ - updated_at         │  - employee_id (FK employees)        │
│                      │                                       │
│                      │  employees:                          │
│                      │  - id (UUID, PK)                     │
│                      │  - employee_id (EMP001, etc)         │
│                      │  - email (matches auth.users.email)  │
│                      │  - name, department, position, etc   │
│                      │                                       │
│                      │  job_postings, attendance,            │
│                      │  leave_requests, payroll, etc...     │
└──────────────────────┴──────────────────────────────────────┘
```

## The Three Tables

### 1. `auth.users` (Managed by Supabase)

This table is created and managed by Supabase. You can read from it but don't directly insert.

```sql
-- Read-only in production
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'john@company.com';
```

### 2. `public.profiles` (Linking Table)

This table **connects** auth users to your business model and roles.

```sql
-- Create
INSERT INTO profiles (id, email, role, employee_id)
VALUES (
  'uuid-from-auth-users',
  'john@company.com',
  'Employee',
  'uuid-from-employees-table'
);

-- Read
SELECT id, email, role FROM profiles WHERE email = 'john@company.com';
```

### 3. `public.employees` (Your Business Data)

This is where you store employee information.

```sql
-- Create
INSERT INTO employees (name, email, department, position, etc)
VALUES (
  'John Doe',
  'john@company.com',
  'IT',
  'Software Engineer',
  ...
);

-- The email MUST match the email in auth.users and profiles
```

## Account Creation Process (Technical)

### Step 1: Admin submits form

```typescript
// In Employees.tsx handleSubmit()
// Admin fills: name, email, department, position, salary, joinDate
await handleSubmit();
```

### Step 2: System calls authService

```typescript
// From src/lib/authService.ts
const result = await createEmployeeAccountWithCredentials(
  'john@company.com',    // email
  'John Doe',           // name
  'Employee'            // role
);
```

### Step 3: Create temporary password

```typescript
// Generate 12-char password with uppercase, lowercase, numbers, special chars
const tempPassword = generateTemporaryPassword();
// Returns: "K9mP#x2Ln$qR" (example)
```

### Step 4: Create Supabase Auth user

```typescript
// Call Supabase Auth API
const { data: { user }, error } = await supabase.auth.signUp({
  email: 'john@company.com',
  password: 'K9mP#x2Ln$qR',
  options: {
    data: {
      name: 'John Doe',
      role: 'Employee',
    },
  },
});

// Returns: user.id = "abc-123-def-456" (UUID)
// Creates record in auth.users table
```

### Step 5: Create profile record

```typescript
// Link auth user to business model
await supabase.from('profiles').insert([{
  id: 'abc-123-def-456',        // Same as auth.users.id
  email: 'john@company.com',
  role: 'Employee',
}]);

// Creates record in profiles table
```

### Step 6: Create employee record

```typescript
// Store business data
await supabase.from('employees').insert([{
  name: 'John Doe',
  email: 'john@company.com',
  department: 'IT',
  position: 'Software Engineer',
  join_date: '2024-04-10',
  // ... other fields
}]);

// Creates record in employees table
```

### Step 7: Return credentials to admin

```typescript
// Show in dialog
return {
  success: true,
  email: 'john@company.com',
  tempPassword: 'K9mP#x2Ln$qR',
  userId: 'abc-123-def-456',
};
```

## Employee Login Flow

### Step 1: Employee visits `/login`

```
https://your-domain.com/login
```

### Step 2: Employee enters credentials

```
Email:    john@company.com
Password: K9mP#x2Ln$qR (temporary)
```

### Step 3: System authenticates against Supabase

```typescript
// In Login.tsx
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'john@company.com',
  password: 'K9mP#x2Ln$qR',
});

// Supabase checks:
// 1. Email exists in auth.users
// 2. Password hash matches
// 3. Email is confirmed (or not required)
```

### Step 4: Supabase forces password change

On first login, Supabase detects the account was just created and prompts to set a new password.

```
"Please change your password"
New Password: [user enters strong password]
```

### Step 5: User is authenticated

```typescript
// Get user info
const user = (await supabase.auth.getUser()).data.user;
// { id: 'abc-123-def-456', email: 'john@company.com' }

// Get role from profiles
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
// { role: 'Employee' }

// Now grant access based on role
if (profile.role === 'Admin') { /* show admin menu */ }
if (profile.role === 'Employee') { /* show employee menu */ }
```

### Step 6: Create session

```typescript
// Store in localStorage
localStorage.setItem('hrms_user', JSON.stringify({
  id: 'abc-123-def-456',
  email: 'john@company.com',
  name: 'John Doe',
  role: 'Employee',
  department: 'IT',
}));
```

## Password Reset Flow

### Admin initiates reset

```typescript
// In Employees.tsx
await resetEmployeePassword('john@company.com');

// Calls:
await supabase.auth.resetPasswordForEmail('john@company.com', {
  redirectTo: 'https://your-domain.com/login',
});
```

### Supabase sends email

```
From: noreply@your-project.supabase.co
To: john@company.com
Subject: Reset your password

Click this link to reset your password:
https://your-domain.com/login?token=xxxx&type=recovery
```

### Employee resets password

1. Click link in email
2. Enter new password
3. Password is updated in `auth.users`
4. Redirected to login
5. Logs in with new password

## Data Flow Examples

### Example 1: Creating an employee

```
Frontend (React)
    ↓
handleSubmit() in Employees.tsx
    ↓
createEmployeeAccountWithCredentials() in authService.ts
    ↓
supabase.auth.signUp() → Creates auth.users record
    ↓
profiles.insert() → Creates profiles record
    ↓
employees.insert() → Creates employees record
    ↓
Show credentials dialog to admin
```

### Example 2: Checking if user has access

```
User clicks "View Reports"
    ↓
Check localStorage.hrms_user.role
    ↓
Is role == 'Admin' or 'HR' or 'Manager'?
    ↓
Yes: Show reports page
No: Show error "Access Denied"
```

### Example 3: User logs out

```
Click "Log Out" button
    ↓
supabase.auth.signOut()
    ↓
localStorage.clear()
    ↓
Redirect to /login
```

## Role-Based Access Control (RBAC)

The system uses `profiles.role` for access control:

```typescript
const user = JSON.parse(localStorage.getItem('hrms_user'));

const canApproveLeave = ['Admin', 'HR', 'Manager'].includes(user.role);
const canViewPayroll = ['Admin', 'HR'].includes(user.role);
const canDeleteEmployee = user.role === 'Admin';

if (!canApproveLeave) {
  toast.error('You do not have permission to approve leave');
  return;
}
```

## Security Features

1. **Passwords are hashed**: Supabase uses bcrypt for password storage
2. **Email verification**: Can be enabled in Supabase settings
3. **Session management**: Supabase manages auth tokens
4. **Row Level Security**: Can be added to tables for user-level permissions
5. **Rate limiting**: Supabase prevents brute force attacks

## Common Issues & Solutions

### Issue: "Email already exists"
**Cause**: The email was already used in a previous signup attempt
**Solution**: Use password reset instead or contact Supabase support to delete orphaned user

### Issue: Password reset email not sent
**Cause**: Email provider not configured in Supabase, or email incorrect
**Solution**: Verify email in Supabase project settings

### Issue: User can't login but account exists
**Cause**: Email not confirmed or account disabled
**Solution**: Check `profiles.role` is not 'Inactive', resend confirmation

## Testing the System

### Test 1: End-to-end account creation

```bash
1. Admin adds: test@example.com
2. Check auth_users table in Supabase (created)
3. Check profiles table (linked with role)
4. Check employees table (created)
5. Use credentials to login at /login
6. Verify user can access employee portal
```

### Test 2: Password reset

```bash
1. Click Key icon next to employee
2. Check email for reset link
3. Click link and set new password
4. Login with new password
5. Verify access
```

### Test 3: Role-based access

```bash
1. Login as Employee
2. Navigate to /payroll (should be restricted)
3. Navigate to /employees (should be restricted)
4. Navigate to /self-service (should work)
5. Logout and login as Admin
6. Verify Admin can see all sections
```

## Next Steps

- Enable email verification: Supabase project settings
- Configure SMTP: For custom email templates
- Enable MFA: For additional security
- Configure SSO: For enterprise auth
- Set up Row Level Security: For granular data access

## References

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase User Management](https://supabase.com/docs/guides/auth/managing-user-data)
- [Role-Based Access Control](https://supabase.com/docs/guides/auth/row-level-security)
