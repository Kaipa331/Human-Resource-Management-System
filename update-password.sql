-- Update password for bit-021-21@must.ac.mw
-- This script should be run in Supabase SQL Editor with service role privileges

-- First, find the user ID
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'bit-021-21@must.ac.mw';
    
    IF user_id IS NOT NULL THEN
        -- Update the user's password
        UPDATE auth.users 
        SET encrypted_password = crypt('Kaipa123P', gen_salt('bf'))
        WHERE id = user_id;
        
        RAISE NOTICE 'Password updated successfully for bit-021-21@must.ac.mw';
    ELSE
        RAISE NOTICE 'User not found: bit-021-21@must.ac.mw';
    END IF;
END $$;

-- Alternative approach if the above doesn't work:
-- Use the Supabase Auth Admin API instead
-- Or manually reset via Supabase Dashboard -> Authentication -> Users

-- For manual reset via Dashboard:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication -> Users
-- 3. Find user: bit-021-21@must.ac.mw
-- 4. Click on the user
-- 5. Click "Reset Password"
-- 6. Set new password: Kaipa123P
