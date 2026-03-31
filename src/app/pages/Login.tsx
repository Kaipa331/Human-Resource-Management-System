import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const demoUserFallbacks: Record<string, { role: string; name: string; department: string }> = {
    'admin@hrms.com': { role: 'Admin', name: 'Demo Admin', department: 'Administration' },
    'hr@hrms.com': { role: 'HR', name: 'Demo HR Manager', department: 'HR' },
    'manager@hrms.com': { role: 'Manager', name: 'Demo Manager', department: 'Operations' },
    'employee@hrms.com': { role: 'Employee', name: 'Demo Employee', department: 'IT' },
  };

  const persistUserSession = async (normalizedEmail: string, userId?: string) => {
    const fallbackUser = demoUserFallbacks[normalizedEmail];

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

    localStorage.setItem('hrms_user', JSON.stringify({
      email: normalizedEmail,
      id: userId || normalizedEmail,
      role: profileData?.role || fallbackUser?.role || 'Employee',
      name: employeeData?.name || fallbackUser?.name || normalizedEmail,
      department: employeeData?.department || fallbackUser?.department || 'General',
    }));
  };

  const tryDemoFallbackLogin = async (normalizedEmail: string) => {
    const fallbackUser = demoUserFallbacks[normalizedEmail];
    const isDemoPassword = password === 'admin123';

    if (!fallbackUser || !isDemoPassword) {
      return false;
    }

    await persistUserSession(normalizedEmail);
    toast.success('Signed in with demo mode!');
    navigate('/');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (!isSupabaseConfigured && await tryDemoFallbackLogin(normalizedEmail)) {
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await persistUserSession(normalizedEmail, data.user.id);
        toast.success('Login successful!');
        navigate('/');
      }
    } catch (error: any) {
      if (await tryDemoFallbackLogin(normalizedEmail)) {
        return;
      }

      const errorMessage = String(error?.message || '');
      const isNetworkFailure = /failed to fetch|networkerror|load failed/i.test(errorMessage);

      toast.error(
        isNetworkFailure
          ? 'Unable to reach Supabase from this Vercel deployment. Demo accounts still work with password admin123.'
          : errorMessage || 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('admin123'); // Assuming default password for demo
    toast.info('Please enter the password for the demo account');
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@hrms.com"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-gray-500 text-center mb-3">Demo Accounts:</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => loginAsDemo('admin@hrms.com')}
              >
                <span className="font-medium">Admin</span>
                <span className="ml-auto text-xs text-gray-500">admin@hrms.com</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => loginAsDemo('hr@hrms.com')}
              >
                <span className="font-medium">HR Manager</span>
                <span className="ml-auto text-xs text-gray-500">hr@hrms.com</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => loginAsDemo('manager@hrms.com')}
              >
                <span className="font-medium">Manager</span>
                <span className="ml-auto text-xs text-gray-500">manager@hrms.com</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => loginAsDemo('employee@hrms.com')}
              >
                <span className="font-medium">Employee</span>
                <span className="ml-auto text-xs text-gray-500">employee@hrms.com</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
