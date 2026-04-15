import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme on mount and when user changes
  useEffect(() => {
    const getUserTheme = () => {
      const storedUser = localStorage.getItem('hrms_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userTheme = localStorage.getItem(`hrms_theme_${user.email}`);
        return userTheme ? userTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    const prefersDark = getUserTheme();
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user]); // Re-run when user changes

  // Toggle theme
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Store theme per user
    const storedUser = localStorage.getItem('hrms_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      localStorage.setItem(`hrms_theme_${user.email}`, newDarkMode ? 'dark' : 'light');
    }
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('hrms_user');
    if (!storedUser && location.pathname !== '/login') {
      navigate('/login');
    } else if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Invalid stored user JSON. Clearing session.', error);
        localStorage.removeItem('hrms_user');
        navigate('/login');
      }
    }
  }, [navigate, location]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar user={user} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          user={user} 
          setUser={setUser} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-y-auto p-8 space-y-8 max-w-[1400px] mx-auto w-full">
          <Outlet />
        </main>
        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-4 h-16 z-50">
          <a className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-400" href="/app">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-[10px] font-bold">Home</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-400" href="/app/employees">
            <span className="material-symbols-outlined">group</span>
            <span className="text-[10px] font-bold">Team</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-blue-700 dark:text-blue-400" href="/app/performance">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>insights</span>
            <span className="text-[10px] font-bold">Performance</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-400" href="/app/self-service">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-bold">Profile</span>
          </a>
        </nav>
      </div>
    </div>
  );
}
