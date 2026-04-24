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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Main Login Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 transform hover:scale-105 transition-transform duration-300">
                  <span className="text-5xl font-bold text-white tracking-tight">HR</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">HRMS</CardTitle>
              <CardDescription className="text-slate-600 font-medium text-base">
                Human Resource Management System
              </CardDescription>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Secure & Reliable</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8">
            {/* Success Messages */}
            {confirmed && (
              <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-green-900 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Email Confirmed</p>
                    <p className="text-xs mt-1">Your email has been confirmed. Please sign in with your credentials.</p>
                  </div>
                </div>
              </div>
            )}
            {passwordReset && (
              <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-green-900 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Password Reset</p>
                    <p className="text-xs mt-1">Your password has been reset successfully. You can now sign in with your new password.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email Address</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 text-slate-900 placeholder:text-slate-400 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 rounded-xl bg-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 text-slate-900 placeholder:text-slate-400 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 rounded-xl bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleForgotPassword}
                  disabled={loading || resetCooldown > 0}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  {resetCooldown > 0 
                    ? `Wait ${resetCooldown}s` 
                    : 'Forgot password?'
                  }
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-xl" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="text-center space-y-3 px-4">
          <p className="text-sm text-slate-300 font-medium">
            Don't have an account?{' '}
            <Link to="/" className="text-blue-400 hover:text-blue-300 font-bold transition-colors duration-300">
              Contact your administrator
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Lock className="w-3 h-3" />
            <span>Secure login powered by Supabase Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
