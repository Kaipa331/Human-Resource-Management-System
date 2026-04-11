# Quick Reference: Employee Account Setup

## For HR Admins: Adding a New Employee

### Step 1: Go to Employee Management
Navigate to **Employees** in the left sidebar

### Step 2: Click "Add Employee"
Click the blue **"+ Add Employee"** button

### Step 3: Fill Employee Details
| Field | Example | Required |
|-------|---------|----------|
| Full Name | John Doe | ✓ |
| Email | john.doe@company.com | ✓ |
| Phone | +265 991 234 567 | |
| Department | IT | ✓ |
| Position | Software Engineer | |
| Salary | 1,500,000 | |
| Join Date | 2024-04-10 | |

### Step 4: Click "Add Employee"
✅ System automatically creates:
- Supabase Auth account
- Employee record in database
- Profile with Employee role
- Temporary password

### Step 5: Secure the Credentials
A dialog appears with:
- **Email**: john.doe@company.com
- **Temporary Password**: (auto-generated)

**⚠️ IMPORTANT**: Copy and send via **secure channel only**
- WhatsApp, Signal, or in-person ✓
- Email, Slack, Teams ✗

### Step 6: Close Dialog
Click **"Done"**

---

## For Employees: First Login

### Step 1: Open Login Page
Go to: `https://your-company.com/login`

### Step 2: Enter Credentials
- **Email**: john.doe@company.com
- **Password**: (temporary password from admin)

### Step 3: Change Password
On first login, Supabase prompts:
- Create a **new, strong password**
- Min 8 characters
- Mix of uppercase, lowercase, numbers

### Step 4: Access System
✅ Logged in! You can now use all features.

---

## Password Recovery: For Employees

### Forgot Your Password?

1. Go to login page
2. Click **"Forgot Password?"**
3. Enter your email
4. Check email for reset link
5. Click link and set new password
6. Log in with new password

---

## Password Reset: For HR Admins

### Reset an Employee's Password

1. Go to **Employees**
2. Find the employee in the list
3. Click the **Key icon** (🔑) in Actions
4. A reset email is sent to the employee
5. Employee receives email with link
6. Employee creates new password

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Email already exists" | Employee may already have account. Use password reset instead. |
| "Can't add employee" | Ensure email is unique and valid (user@domain.com) |
| "Didn't receive reset email" | Check spam folder, wait 5 minutes, resend |
| "Password too weak" | Use 8+ chars with uppercase, lowercase, numbers |
| "Can't log in" | Verify email/password correct, check Caps Lock, try reset |

---

## Security Checklist

✅ **DO:**
- Share passwords securely
- Use strong passwords (8+ chars)
- Change default passwords
- Remind employees about passwords
- Log out from shared computers

❌ **DON'T:**
- Email passwords
- Share in Slack/Teams
- Use simple passwords (123456, password)
- Write passwords on sticky notes
- Reuse passwords across accounts

---

## Key Features by Role

### Admin
- ✓ Add/edit/delete employees
- ✓ Approve leave
- ✓ Generate reports
- ✓ Manage all settings

### HR Manager
- ✓ View employees
- ✓ Approve leave
- ✓ Manage training
- ✓ Generate payroll

### Manager
- ✓ View team records
- ✓ Approve team leave
- ✓ View performance
- ✗ Cannot manage other departments

### Employee
- ✓ Update own profile
- ✓ Request leave
- ✓ View payslips
- ✓ Enroll in training
- ✓ Upload documents

---

## Account Creation Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│         ADMIN: Employee Management                   │
│      Click "Add Employee" Button                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         ADMIN: Fill Employee Form                    │
│    Name, Email, Department, Position, etc.          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│    SYSTEM: Create Account Automatically             │
│  ├─ Generate temporary password                     │
│  ├─ Create Supabase Auth user                       │
│  ├─ Create employee record                          │
│  ├─ Create profile with role                        │
│  └─ Display credentials to admin                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│    ADMIN: Securely Share Credentials                │
│  ├─ Email address                                   │
│  ├─ Temporary password                              │
│  └─ Login URL: /login                               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│   EMPLOYEE: First Login at /login                   │
│  ├─ Enter email & temp password                     │
│  ├─ Supabase prompts: Set new password              │
│  ├─ Enter strong password (8+ chars)                │
│  └─ ✅ Account activated                            │
└─────────────────────────────────────────────────────┘
```

---

## Support

**For Setup Help**: See ACCOUNT_CREATION_GUIDE.md

**For Technical Issues**: Check README.md setup section

**For Supabase Issues**: https://supabase.com/docs
