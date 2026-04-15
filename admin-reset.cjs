// This script requires SERVICE_ROLE_KEY from Supabase
// Run with: SERVICE_ROLE_KEY=your_service_role_key node admin-reset.cjs

const { createClient } = require('@supabase/supabase-js');

// Get service role key from environment
const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL in environment');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Missing SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY in environment');
  console.log('Please set the service role key and run again:');
  console.log('SERVICE_ROLE_KEY=your_service_role_key node admin-reset.cjs');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetUserPassword() {
  const email = 'bit-021-21@must.ac.mw';
  const newPassword = 'Kaipa123P';

  try {
    console.log(`Resetting password for: ${email}`);
    
    // Use admin API to update user password
    const { data, error } = await supabase.auth.admin.updateUserByEmail(
      email,
      { password: newPassword }
    );

    if (error) {
      console.error('Error updating password:', error);
      return;
    }

    console.log('✅ Password successfully updated!');
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetUserPassword();
