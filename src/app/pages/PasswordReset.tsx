import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader } from '../components/ui/Loader';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Lock, Sparkles } from 'lucide-react';

export function PasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have a valid recovery token from Supabase
  useEffect(() => {
    const type = searchParams.get('type');
    const hash = window.location.hash;
    
    // Supabase sends recovery tokens in the URL hash or as query params
    if (!type && !hash.includes('access_token')) {
      setError('Invalid or expired password reset link. Please request a new one from the login page.');
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setError('Please enter both password fields');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Update the password using the recovery session
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to reset password');
      } else {
        toast.success('Password reset successful! Redirecting to login...');
        // Clear session and redirect to login
        localStorage.removeItem('hrms_user');
        setTimeout(() => navigate('/login?passwordReset=true'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-8rem] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {loading && <Loader fullScreen text="Resetting your password..." />}

      <Card className="w-full max-w-lg overflow-hidden border border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex items-center justify-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
              <Lock className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            Secure recovery
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Reset Password
          </CardTitle>
          <CardDescription className="text-base text-slate-500 dark:text-slate-400">
            Enter a new password to restore access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
              {error}
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-base font-bold shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:via-indigo-700 hover:to-emerald-700"
                disabled={loading}
              >
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
