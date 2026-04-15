import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, Calendar, TrendingUp, UserCheck, Loader2, BriefcaseBusiness, Clock3, FileText } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { MobileLayout, MobileCard, MobileGrid, MobileStatCard, MobileTable } from '../components/MobileLayout';

export function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');
  const isEmployee = user?.role === 'Employee';

  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [departmentData, setDepartmentData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<{ name: string; department: string; join_date: string }[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<{ employee_name: string; type: string; status: string; start_date: string }[]>([]);
  const [daysPresentThisMonth, setDaysPresentThisMonth] = useState(0);
  const [approvedPersonalLeaves, setApprovedPersonalLeaves] = useState(0);

  const departmentColors: Record<string, string> = {
    IT: '#3b82f6', Sales: '#10b981', HR: '#f59e0b',
    Finance: '#8b5cf6', Marketing: '#ec4899', Operations: '#06b6d4',
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (isEmployee) {
        // Employee-specific data
        setDaysPresentThisMonth(18);
        setApprovedPersonalLeaves(2);
      } else {
        // Admin/HR data
        setTotalEmployees(247);
        setPresentToday(235);
        setPendingLeaves(8);
        setDepartmentData([
          { name: 'IT', value: 45, color: departmentColors.IT },
          { name: 'Sales', value: 62, color: departmentColors.Sales },
          { name: 'HR', value: 18, color: departmentColors.HR },
          { name: 'Finance', value: 28, color: departmentColors.Finance },
          { name: 'Marketing', value: 35, color: departmentColors.Marketing },
          { name: 'Operations', value: 59, color: departmentColors.Operations },
        ]);
        setRecentEmployees([
          { name: 'John Doe', department: 'IT', join_date: '2026-03-15' },
          { name: 'Jane Smith', department: 'Sales', join_date: '2026-03-14' },
          { name: 'Mike Johnson', department: 'HR', join_date: '2026-03-13' },
        ]);
        setRecentLeaves([
          { employee_name: 'Alice Brown', type: 'Annual', status: 'Pending', start_date: '2026-03-20' },
          { employee_name: 'Bob Wilson', type: 'Sick', status: 'Approved', start_date: '2026-03-18' },
          { employee_name: 'Carol Davis', type: 'Personal', status: 'Pending', start_date: '2026-03-22' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: 'Total Employees', value: String(totalEmployees), icon: Users, change: '', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Present Today', value: String(presentToday), icon: UserCheck, change: totalEmployees > 0 ? `${((presentToday / totalEmployees) * 100).toFixed(1)}%` : '0%', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Pending Leaves', value: String(pendingLeaves), icon: Calendar, change: '', color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Departments', value: String(departmentData.length), icon: TrendingUp, change: '', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const employeeStats = [
    { title: 'My Role', value: user?.role || 'Employee', helper: 'Access level', icon: BriefcaseBusiness, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Department', value: user?.department || 'General', helper: 'Current team', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { title: 'Pending Leave', value: String(pendingLeaves), helper: 'Awaiting approval', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Days Present', value: String(daysPresentThisMonth), helper: 'This month', icon: Clock3, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const heroTitle = isEmployee
    ? `Welcome back, ${user?.name || 'Team Member'}`
    : 'Accelerate your HR operations';
  const heroSubtitle = isEmployee
    ? 'Manage your attendance, leave requests, and employee details in one beautiful workspace.'
    : 'A modern HR dashboard built for employee lifecycle, payroll, attendance, and performance.';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isEmployee) {
    return (
      <MobileLayout
        title={heroTitle}
        subtitle={heroSubtitle}
      >
        <div className="space-y-6">
          {/* Stats Grid */}
          <MobileGrid cols={2} gap={4}>
            {employeeStats.map((stat, index) => (
              <MobileStatCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.helper}
                icon={stat.icon}
              />
            ))}
          </MobileGrid>

          {/* Recent Activity */}
          <MobileCard title="Recent Activity" subtitle="Your latest updates">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Days Present This Month</span>
                <Badge variant="secondary">{daysPresentThisMonth}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Approved Personal Leaves</span>
                <Badge variant="secondary">{approvedPersonalLeaves}</Badge>
              </div>
            </div>
          </MobileCard>

          {/* Quick Actions */}
          <MobileCard title="Quick Actions" subtitle="Common tasks">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/self-service?tab=attendance')}
                className="w-full"
              >
                <Clock3 className="w-4 h-4 mr-2" />
                Attendance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/self-service?tab=leave')}
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Leave
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/self-service?tab=personal')}
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/self-service?tab=settings')}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </MobileCard>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title={heroTitle}
      subtitle={heroSubtitle}
      actions={
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/app/self-service')}>
            My Portal
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/attendance')}>
            Attendance
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <MobileGrid cols={2} gap={4}>
          {stats.map((stat, index) => (
            <MobileStatCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              trend={stat.change.includes('+') ? 'up' : stat.change.includes('-') ? 'down' : 'neutral'}
            />
          ))}
        </MobileGrid>

        {/* Department Distribution */}
        {departmentData.length > 0 && (
          <MobileCard title="Department Distribution" subtitle="Employee count by department">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </MobileCard>
        )}

        {/* Recent Employees */}
        <MobileCard title="Recent Employees" subtitle="Latest team members">
          <MobileTable
            headers={[
              { key: 'name', label: 'Name' },
              { key: 'department', label: 'Department' },
              { key: 'join_date', label: 'Join Date' },
            ]}
            rows={recentEmployees}
            emptyMessage="No recent employees"
          />
        </MobileCard>

        {/* Recent Leave Requests */}
        <MobileCard title="Recent Leave Requests" subtitle="Latest leave applications">
          <MobileTable
            headers={[
              { key: 'employee_name', label: 'Employee' },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status' },
              { key: 'start_date', label: 'Start Date' },
            ]}
            rows={recentLeaves}
            emptyMessage="No recent leave requests"
          />
        </MobileCard>
      </div>
    </MobileLayout>
  );
}
