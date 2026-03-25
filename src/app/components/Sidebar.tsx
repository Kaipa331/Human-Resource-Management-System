import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  GraduationCap, 
  FileText,
  UserCircle,
  X
} from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  user: any;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ user, isOpen, setIsOpen }: SidebarProps) {
  const isHRorAdmin = user?.role === 'HR' || user?.role === 'Admin';
  const isManager = user?.role === 'Manager';

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/self-service', icon: UserCircle, label: 'My Portal', show: true },
    { to: '/employees', icon: Users, label: 'Employees', show: isHRorAdmin },
    { to: '/recruitment', icon: UserPlus, label: 'Recruitment', show: isHRorAdmin },
    { to: '/leave', icon: Calendar, label: 'Leave Management', show: isHRorAdmin || isManager },
    { to: '/attendance', icon: Clock, label: 'Attendance', show: isHRorAdmin || isManager },
    { to: '/payroll', icon: DollarSign, label: 'Payroll', show: isHRorAdmin },
    { to: '/performance', icon: TrendingUp, label: 'Performance', show: isHRorAdmin || isManager },
    { to: '/training', icon: GraduationCap, label: 'Training', show: isHRorAdmin },
    { to: '/reports', icon: FileText, label: 'Reports', show: isHRorAdmin || isManager },
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform
      lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">e-HRMS</h1>
          <p className="text-sm text-gray-500 mt-1">Human Resource System</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          onClick={() => setIsOpen(false)}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.filter(item => item.show).map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2026 e-HRMS</p>
        </div>
      </div>
    </div>
  );
}
