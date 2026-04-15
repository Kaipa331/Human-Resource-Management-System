import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { resetEmployeePassword } from '../../lib/authService';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const searchParams = new URLSearchParams(window.location.search);
  const confirmed = searchParams.get('confirmed') === 'true';
  const passwordReset = searchParams.get('passwordReset') === 'true';

  
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
    const role = profileData?.role || 'Employee';

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

    if (resetCooldown > 0) {
      toast.error(`Please wait ${resetCooldown} seconds before requesting another password reset.`);
      return;
    }

    setLoading(true);
    
    try {
      const result = await resetEmployeePassword(normalizedEmail);
      
      if (result.success) {
        if (result.error && result.error.includes('Demo mode')) {
          toast.info(result.error);
        } else {
          toast.success('Password reset email sent! Check your inbox for a link to reset your password.');
          // Set cooldown for 5 minutes (300 seconds)
          setResetCooldown(300);
        }
      } else {
        toast.error(result.error || 'Unable to send password reset email. Please try again.');
        // If rate limited, set longer cooldown
        if (result.error?.includes('rate limit') || result.error?.includes('Too many')) {
          setResetCooldown(600); // 10 minutes
        }
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error('An unexpected error occurred. Please try again or contact your administrator.');
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => {
        setResetCooldown(resetCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  useEffect(() => {
    const storedUser = localStorage.getItem('hrms_user');
    if (storedUser) {
      navigate('/app');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Login Card */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-white">HR</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold text-slate-900">HRMS</CardTitle>
              <CardDescription className="text-slate-600 font-medium">
                Human Resource Management System
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Messages */}
            {confirmed && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Email Confirmed</p>
                    <p className="text-sm">Your email has been confirmed. Please sign in with your credentials.</p>
                  </div>
                </div>
              </div>
            )}
            {passwordReset && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Password Reset</p>
                    <p className="text-sm">Your password has been reset successfully. You can now sign in with your new password.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-slate-900 placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 text-slate-900 placeholder:text-slate-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleForgotPassword}
                  disabled={loading || resetCooldown > 0}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resetCooldown > 0 
                    ? `Wait ${resetCooldown}s` 
                    : 'Forgot password?'
                  }
                </Button>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            
            </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-600 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact your administrator
            </Link>
          </p>
          <p className="text-xs text-slate-500">
            Secure login powered by Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
}
