import { Bell, Settings, LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  user: any;
  setUser: (user: any) => void;
  toggleSidebar: () => void;
}

export function Header({ user, setUser, toggleSidebar }: HeaderProps) {
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
    navigate('/self-service?tab=settings');
  };

  const openProfile = () => {
    navigate('/self-service?tab=personal');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('hrms_user');
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 line-clamp-1">
              Welcome, {user?.name}
            </h2>
            <p className="hidden md:block text-sm text-gray-500">{user?.role} • {user?.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications" type="button">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500">
                  {notifications.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-80 bg-white border border-gray-200 shadow-lg">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.title} className="items-start">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-500">{notification.description}</p>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
                aria-label="Open account menu"
                type="button"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500">{user?.role || 'Account'}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-white border border-gray-200 shadow-lg">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
