import { NavLink } from 'react-router';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  user: any;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ user, isOpen, setIsOpen }: SidebarProps) {
  const isHRorAdmin = user?.role === 'HR' || user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isEmployee = user?.role === 'Employee';
  const attendanceLabel = isHRorAdmin || isManager ? 'Attendance Review' : 'My Attendance';
  const dashboardLabel = isEmployee ? 'My Dashboard' : 'Dashboard';

  const menuItems = [
    { to: '/app', iconName: 'dashboard', label: dashboardLabel, show: true },
    { to: '/app/self-service', iconName: 'person_pin', label: 'My Portal', show: true },
    { to: '/app/employees', iconName: 'group', label: 'Employees', show: isHRorAdmin },
    { to: '/app/department', iconName: 'domain', label: 'Departments', show: isHRorAdmin },
    { to: '/app/recruitment', iconName: 'person_add', label: 'Recruitment', show: isHRorAdmin },
    { to: '/app/leave', iconName: 'event_busy', label: 'Leave', show: isHRorAdmin || isManager },
    { to: '/app/attendance', iconName: 'fact_check', label: 'Attendance', show: true },
    { to: '/app/payroll', iconName: 'payments', label: 'Payroll', show: isHRorAdmin },
    { to: '/app/performance', iconName: 'insights', label: 'Performance', show: isHRorAdmin || isManager },
    { to: '/app/training', iconName: 'school', label: 'Training', show: isHRorAdmin },
    { to: '/app/reports', iconName: 'assessment', label: 'Reports', show: isHRorAdmin || isManager },
  ];

  return (
    <div className={`
      hidden md:flex fixed inset-y-0 left-0 z-30 w-64 docked left-0 overflow-y-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex-col gap-2 p-6 sticky top-0 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative
    `}>
      <div className="mb-8">
        <span className="text-lg font-black text-blue-900 dark:text-blue-400">HRMS Atelier</span>
      </div>
      
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.filter(item => item.show).map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 font-semibold text-sm rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/90 text-blue-900 dark:text-white shadow-sm dark:shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.iconName}
                </span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-6 flex items-center gap-3 border-t border-slate-200 dark:border-slate-800">
        <img 
          alt="Admin Profile" 
          className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuChMpv_gHO_l47Q3x_ez-OC6y9WqqYcSXjufsAcNPKyaRmHCjvZ91C64CqntUif4v87n2nCwPK3Mak2WZvki5WwkkWIZQiobf_szskr2NQaFtINrJgFbb-vwvI9_dFV7Nl_1_901Np3xc_v4AAx0AwhtsibMd-6L4evZp-C7NSDxhUZPNiU8lRA2rMv_RkhZIWVHTK76x43EVMkhU5gkJu2kMuRHSg6nBSbDRhPZvnAR5yLovQZzMpomM4QhS1oz0I5jRgirkwOaNI"
        />
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-slate-900 dark:text-blue-400 truncate">{user?.name || 'System Admin'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Global Overview'}</p>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-6 right-6 lg:hidden text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900"
        onClick={() => setIsOpen(false)}
      >
        <X className="w-6 h-6" />
      </Button>
    </div>
  );
}
