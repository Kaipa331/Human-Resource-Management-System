# Password Reset Instructions for bit-021-21@must.ac.mw

## Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to Authentication section

2. **Find the User**
   - Click on "Users" tab
   - Search for: `bit-021-21@must.ac.mw`
   - Click on the user row

3. **Reset Password**
   - Click "Reset Password" button
   - Enter new password: `Kaipa123P`
   - Confirm the password reset

## Method 2: SQL Editor

1. **Go to Supabase SQL Editor**
   - In your Supabase dashboard, go to "SQL Editor"
   - Create a new query

2. **Run this SQL:**
```sql
-- Update user password
UPDATE auth.users 
SET encrypted_password = crypt('Kaipa123P', gen_salt('bf'))
WHERE email = 'bit-021-21@must.ac.mw';
```

## Method 3: Use Forgot Password Feature

1. **Go to your HRMS login page**
2. **Click "Forgot password?"**
3. **Enter email:** `bit-021-21@must.ac.mw`
4. **Check email** and follow reset link
5. **Set new password:** `Kaipa123P`

## Verification

After resetting, verify the user can login with:
- **Email:** bit-021-21@must.ac.mw
- **Password:** Kaipa123P

## Notes

- The password `Kaipa123P` meets basic security requirements
- User will be able to login immediately after reset
- No email notification will be sent for manual admin resets
