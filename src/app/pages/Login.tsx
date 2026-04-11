import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { resetEmployeePassword } from '../../lib/authService';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const confirmed = searchParams.get('confirmed') === 'true';
  const passwordReset = searchParams.get('passwordReset') === 'true';

  const adminOverrideEmail = 'kaipap332gmail.com';

  const persistUserSession = async (normalizedEmail: string, userId?: string) => {
    const [profileResult, employeeResult] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('role')
        .eq('email', normalizedEmail)
        .maybeSingle(),
      supabase
        .from('employees')
        .select('name, department')
        .eq('email', normalizedEmail)
        .maybeSingle(),
    ]);

    const profileData = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
    const employeeData = employeeResult.status === 'fulfilled' ? employeeResult.value.data : null;
    const role = normalizedEmail === adminOverrideEmail ? 'Admin' : (profileData?.role || 'Employee');

    localStorage.setItem('hrms_user', JSON.stringify({
      email: normalizedEmail,
      id: userId || normalizedEmail,
      role,
      name: employeeData?.name || normalizedEmail,
      department: employeeData?.department || 'General',
    }));
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await persistUserSession(normalizedEmail, data.user.id);
        toast.success('Login successful!');
        navigate('/app');
      }
    } catch (error: any) {
      const errorMessage = String(error?.message || '');
      toast.error(errorMessage || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('hrms_user');
    if (storedUser) {
      navigate('/app');
    }
  }, [navigate]);

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) {
      toast.error('Please enter your email address first');
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      toast.error('Please enter a valid email address before requesting a password reset.');
      return;
    }

    setLoading(true);
    const result = await resetEmployeePassword(normalizedEmail);
    setLoading(false);
    
    if (result.success) {
      toast.success('Password reset email sent. Check your inbox for a link to reset your password.');
    } else {
      toast.error(result.error || 'Unable to send password reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">e</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">e-HRMS</CardTitle>
          <CardDescription className="text-center">
            Human Resource Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          {confirmed && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 mb-4">
              Your email has been confirmed. Please sign in with the temporary password sent by your administrator, or use the forgot password link to set a new password.
            </div>
          )}
          {passwordReset && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 mb-4">
              Your password has been reset successfully. You can now sign in with your new password.
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button type="button" variant="outline" onClick={handleForgotPassword} disabled={loading}>
                Forgot password?
              </Button>
            </div>
          </form>


        </CardContent>
      </Card>
    </div>
  );
}
