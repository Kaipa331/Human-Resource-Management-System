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
import { SearchService, SearchResult } from '../../lib/searchService';
import { useEffect, useState } from 'react';
import { Users, GraduationCap, Briefcase, Target, Search as SearchIcon } from 'lucide-react';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await SearchService.universalSearch(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (link: string) => {
    navigate(link);
    setShowResults(false);
    setSearchQuery('');
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
            placeholder="Search employees, training, jobs..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />

          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[500px] overflow-y-auto backdrop-blur-xl">
              {isSearching ? (
                <div className="p-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Searching HRMS...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {['Employee', 'Training', 'Recruitment', 'Performance'].map(type => {
                    const group = searchResults.filter(r => r.type === type);
                    if (group.length === 0) return null;
                    return (
                      <div key={type}>
                        <div className="px-5 py-3 text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                          {type === 'Employee' && <Users className="w-3 h-3" />}
                          {type === 'Training' && <GraduationCap className="w-3 h-3" />}
                          {type === 'Recruitment' && <Briefcase className="w-3 h-3" />}
                          {type === 'Performance' && <Target className="w-3 h-3" />}
                          {type === 'Employee' ? 'Team Members' : type + 's'}
                        </div>
                        {group.map(result => (
                          <div
                            key={result.id}
                            className="px-5 py-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all border-b last:border-0 border-slate-100 dark:border-slate-900 flex items-center justify-between group"
                            onClick={() => handleResultClick(result.link)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                                {type === 'Employee' ? <Users className="w-5 h-5" /> : 
                                 type === 'Training' ? <GraduationCap className="w-5 h-5" /> :
                                 type === 'Recruitment' ? <Briefcase className="w-5 h-5" /> :
                                 <Target className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{result.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{result.subtitle}</p>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-transparent group-hover:text-blue-400 text-[20px] transition-all -translate-x-2 group-hover:translate-x-0">arrow_forward</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                   <SearchIcon className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                   <p className="text-base text-slate-900 dark:text-slate-100 font-bold">No results found for "{searchQuery}"</p>
                   <p className="text-sm text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">We couldn't find any employees, courses, or jobs matching your query.</p>
                </div>
              )}
            </div>
          )}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
              <img
                alt="Employee profile photo"
                data-alt="close-up portrait of a woman smiling professionally in a bright studio environment"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaOFeYty42I2ycIE4xU46tFrJd_WdwpxnP1lri0mLHVW-OTuoHhbTz_I7YfCFbIHbqtsMn2BHKmL8_onXSIkYbtYy59JWp0VFwvpzhrndiKA-Rm-emSkHzKQH3QvG4QPr1WoPRk2OgLVGBIsiJ9frT3qfqbUGR_6eKyBiNiVtAESOafczz-4_rq3xQGkg7EABs8fQ-KeWcIjeCSiUvZvWOKVtaEx1_c_YypaPJcLsBZ19VtJwLIVeMunkO3lIO2f8TuVPv2cJAEWs"
                className="w-full h-full object-cover"
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@example.com'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openProfile}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
