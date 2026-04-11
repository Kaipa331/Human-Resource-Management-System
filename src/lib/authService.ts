import { supabase } from './supabase';

/**
 * Generate a temporary password for new employees
 */
export const generateTemporaryPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 0; i < 8; i++) {
    const allChars = uppercase + lowercase + numbers + special;
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Create a Supabase Auth user account for a new employee
 * This uses the standard signUp flow which works with anon keys
 * Employee must confirm email or change password on first login
 */
export const createEmployeeAccount = async (
  email: string,
  name: string,
  role: string = 'Employee'
): Promise<{ userId: string; tempPassword: string } | null> => {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Generate a temporary password
    const tempPassword = generateTemporaryPassword();

    // First, check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile?.id) {
      console.error('Profile already exists for this email:', normalizedEmail);
      return null;
    }

    // Attempt to create Supabase Auth user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: tempPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
        data: {
          name,
          role,
        },
      },
    });

    if (signUpError) {
      console.error('Auth signup error:', signUpError);
      // Common error: user already exists
      if (signUpError.message.includes('already registered')) {
        // Try to get existing user (won't work with anon key, but we can suggest reset)
        return null;
      }
      return null;
    }

    if (!user?.id) {
      console.error('User creation returned no ID');
      return null;
    }

    // Create a profile record linking the auth user to employee and role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: normalizedEmail,
        role: role,
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Auth user was created but profile failed - partial success
      // The user will still be able to log in, but without role
      return {
        userId: user.id,
        tempPassword: tempPassword,
      };
    }

    return {
      userId: user.id,
      tempPassword: tempPassword,
    };
  } catch (error) {
    console.error('Error creating employee account:', error);
    return null;
  }
};

/**
 * Create employee account with auto-generated credentials
 * Used by admins during employee creation
 */
export const createEmployeeAccountWithCredentials = async (
  email: string,
  name: string,
  role: string = 'Employee'
): Promise<{
  success: boolean;
  userId?: string;
  tempPassword?: string;
  email: string;
  error?: string;
}> => {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return {
        success: false,
        email: normalizedEmail,
        error: 'Invalid email format',
      };
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile?.id) {
      return {
        success: false,
        email: normalizedEmail,
        error: 'Account already exists for this email',
      };
    }

    const result = await createEmployeeAccount(normalizedEmail, name, role);

    if (!result) {
      return {
        success: false,
        email: normalizedEmail,
        error: 'Failed to create account. Email may already be registered in Supabase Auth.',
      };
    }

    return {
      success: true,
      userId: result.userId,
      tempPassword: result.tempPassword,
      email: normalizedEmail,
    };
  } catch (error: any) {
    return {
      success: false,
      email,
      error: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Reset an employee's password via email
 * Employee will receive a link to set a new password
 */
export const resetEmployeePassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return {
        success: false,
        error: 'Invalid email format. Please enter a valid email address.',
      };
    }

    console.log('Attempting password reset for:', normalizedEmail);

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/password-reset`,
    });

    if (error) {
      console.error('Password reset error:', error);
      const message = String(error.message || 'Failed to send password reset email');
      if (/limit|rate limit|throttl/i.test(message)) {
        return {
          success: false,
          error: 'Password reset request limit reached. Please wait a few minutes before trying again.',
        };
      }
      return {
        success: false,
        error: message,
      };
    }

    console.log('Password reset email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error in resetEmployeePassword:', error);
    const message = String(error?.message || 'An error occurred while sending reset email');
    if (/limit|rate limit|throttl/i.test(message)) {
      return {
        success: false,
        error: 'Password reset request limit reached. Please wait a few minutes before trying again.',
      };
    }
    return {
      success: false,
      error: message,
    };
  }
};

/**
 * Disable an employee account (mark as Inactive in profiles)
 * This prevents them from logging in without deleting auth user
 */
export const disableEmployeeAccount = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'Inactive' })
      .eq('id', userId);

    if (error) {
      console.error('Error disabling account:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in disableEmployeeAccount:', error);
    return false;
  }
};

/**
 * Get employee profile info (for debugging/admin purposes)
 */
export const getEmployeeProfile = async (email: string) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getEmployeeProfile:', error);
    return null;
  }
};

