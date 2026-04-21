import { useRouteError, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { AlertCircle, Home, RefreshCw, ChevronLeft } from 'lucide-react';

export function ErrorPage() {
  const error: any = useRouteError();
  const navigate = useNavigate();

  console.error('Application Error:', error);

  const is404 = error?.status === 404;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Animated Error Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-25"></div>
          <div className="relative bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-800 rounded-3xl p-5 shadow-xl">
             <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-500" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {is404 ? 'Page Not Found' : 'System Hiccup!'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            {is404 
              ? "The resource you're looking for doesn't exist or has been moved to a different department." 
              : "Something unexpected happened in our system. Don't worry, your data is safe and our engineers have been notified."
            }
          </p>
        </div>

        {/* Error Details (Subtle) */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
           <code className="text-xs text-slate-500 font-mono break-all leading-tight">
             Error Instance: {error?.statusText || error?.message || 'Unknown Runtime Exception'}
           </code>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            size="lg" 
            className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-95 text-base font-bold"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto px-8 py-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all active:scale-95 text-base font-bold"
            onClick={() => navigate('/app')}
          >
            <Home className="w-5 h-5 mr-2" />
            Go Dashboard
          </Button>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mx-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-sm font-medium pt-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to previous page
        </button>
      </div>

      {/* Footer Branding */}
      <div className="fixed bottom-12 left-0 right-0">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-800">
           Advanced HRMS • Technical Safeguard Enabled
         </p>
      </div>
    </div>
  );
}
