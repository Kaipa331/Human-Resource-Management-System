import { NavLink } from 'react-router';
import { X, Home, User, Users, Building, UserPlus, Calendar, Clock, DollarSign, TrendingUp, Award, BookOpen, BarChart, Settings } from 'lucide-react';
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

  const menuItems = [
    { to: '/app', icon: Home, label: 'Dashboard', show: true },
    { to: '/app/self-service', icon: User, label: 'My Portal', show: true },
    { to: '/app/employees', icon: Users, label: 'Employees', show: isHRorAdmin },
    { to: '/app/department', icon: Building, label: 'Departments', show: isHRorAdmin },
    { to: '/app/recruitment', icon: UserPlus, label: 'Recruitment', show: isHRorAdmin },
    { to: '/app/leave', icon: Calendar, label: 'Leave', show: isHRorAdmin || isManager },
    { to: '/app/attendance', icon: Clock, label: 'Attendance', show: true },
    { to: '/app/payroll', icon: DollarSign, label: 'Payroll', show: isHRorAdmin },
    { to: '/app/performance', icon: TrendingUp, label: 'Performance', show: isHRorAdmin || isManager },
    { to: '/app/succession', icon: Award, label: 'Succession', show: isHRorAdmin || isManager },
    { to: '/app/training', icon: BookOpen, label: 'Training', show: isHRorAdmin },
    { to: '/app/reports', icon: BarChart, label: 'Reports', show: isHRorAdmin || isManager },
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex-col gap-2 p-4 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden
      `}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-black text-blue-900 dark:text-blue-400">HRMS</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/app'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 font-medium text-sm rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-700">
              <img
                alt="Employee profile photo"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaOFeYty42I2ycIE4xU46tFrJd_WdwpxnP1lri0mLHVW-OTuoHhbTz_I7YfCFbIHbqtsMn2BHKmL8_onXSIkYbtYy59JWp0VFwvpzhrndiKA-Rm-emSkHzKQH3QvG4QPr1WoPRk2OgLVGBIsiJ9frT3qfqbUGR_6eKyBiNiVtAESOafczz-4_rq3xQGkg7EABs8fQ-KeWcIjeCSiUvZvWOKVtaEx1_c_YypaPJcLsBZ19VtJwLIVeMunkO3lIO2f8TuVPv2cJAEWs"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Employee'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - Improved */}
      <div className="hidden md:flex w-64 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex-col gap-2 p-6 border-r border-slate-200 dark:border-slate-800">
        <div className="mb-8">
          <span className="text-lg font-black text-blue-900 dark:text-blue-400">HRMS Atelier</span>
        </div>
        
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/app'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 font-semibold text-sm rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
