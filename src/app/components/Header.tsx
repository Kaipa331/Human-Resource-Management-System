import { Settings, LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  user: any;
  setUser: (user: any) => void;
  toggleSidebar: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export function Header({ user, setUser, toggleSidebar, isDarkMode = false, toggleTheme }: HeaderProps) {
  const navigate = useNavigate();
  const isEmployee = user?.role === 'Employee';

  const notifications = isEmployee
    ? [
        { title: 'Leave balance updated', description: 'Your annual leave balance is ready to review.' },
        { title: 'Attendance reminder', description: 'Remember to complete today’s check-in before the end of day.' },
        { title: 'Profile update', description: 'Review your personal details from the settings tab.' },
      ]
    : [
        { title: 'Leave Request Pending', description: 'Precious Kaipa requested annual leave.' },
        { title: 'Payroll Processed', description: 'March 2026 payroll completed successfully.' },
        { title: 'Performance Review Due', description: '5 reviews are still pending completion.' },
      ];

  const openSettings = () => {
    navigate('/app/self-service?tab=settings');
  };

  const openProfile = () => {
    navigate('/app/self-service?tab=personal');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('hrms_user');
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="bg-white/80 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 w-full h-16 flex justify-between items-center px-8 border-b border-slate-200 dark:border-slate-800 shadow-[0px_12px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-4 flex-1 text-slate-900 dark:text-slate-100">
        <button
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors"
          onClick={toggleSidebar}
        >
          <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            placeholder="Search employee performance..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6 ml-4">
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <button
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
                <span className="material-symbols-outlined text-[24px]" data-icon="notifications">notifications</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.title} className="items-start">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{notification.description}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Notification settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
            <span className="material-symbols-outlined text-[24px]" data-icon="help">help</span>
          </button>
          <button className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900" onClick={openSettings}>
            <span className="material-symbols-outlined text-[24px]" data-icon="settings">settings</span>
          </button>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-700">
          <img
            alt="Employee profile photo"
            data-alt="close-up portrait of a woman smiling professionally in a bright studio environment"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaOFeYty42I2ycIE4xU46tFrJd_WdwpxnP1lri0mLHVW-OTuoHhbTz_I7YfCFbIHbqtsMn2BHKmL8_onXSIkYbtYy59JWp0VFwvpzhrndiKA-Rm-emSkHzKQH3QvG4QPr1WoPRk2OgLVGBIsiJ9frT3qfqbUGR_6eKyBiNiVtAESOafczz-4_rq3xQGkg7EABs8fQ-KeWcIjeCSiUvZvWOKVtaEx1_c_YypaPJcLsBZ19VtJwLIVeMunkO3lIO2f8TuVPv2cJAEWs"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
