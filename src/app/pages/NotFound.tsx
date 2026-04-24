import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Home, ArrowLeft, Sparkles, TriangleAlert } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 transition-colors duration-500 dark:bg-slate-950">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-8rem] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-xl overflow-hidden border border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
        <CardHeader className="items-center space-y-4 text-center pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            Route not found
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 shadow-lg shadow-blue-500/25">
            <TriangleAlert className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            404
          </CardTitle>
          <CardDescription className="max-w-md text-base text-slate-500 dark:text-slate-400">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate('/')} className="w-full sm:w-auto">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
