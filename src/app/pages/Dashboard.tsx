import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Calendar, TrendingUp, UserCheck, Loader2, BriefcaseBusiness, Clock3, FileText } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

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
        const emailToQuery = String(user?.email || '').toLowerCase();
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartString = monthStart.toISOString().split('T')[0];

        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('email', emailToQuery)
          .maybeSingle();

        if (!employee?.id) {
          setPendingLeaves(0);
          setDaysPresentThisMonth(0);
          setApprovedPersonalLeaves(0);
          setRecentLeaves([]);
          return;
        }

        const [{ count: attendanceCount }, { data: myLeaves }] = await Promise.all([
          supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('employee_id', employee.id)
            .gte('date', monthStartString),
          supabase
            .from('leave_requests')
            .select('type, status, start_date')
            .eq('employee_id', employee.id)
            .order('id', { ascending: false })
            .limit(4),
        ]);

        const personalLeaves = myLeaves || [];
        setDaysPresentThisMonth(attendanceCount || 0);
        setPendingLeaves(personalLeaves.filter((leave) => leave.status === 'Pending').length);
        setApprovedPersonalLeaves(personalLeaves.filter((leave) => leave.status === 'Approved').length);
        setRecentLeaves(
          personalLeaves.map((leave) => ({
            employee_name: 'You',
            type: leave.type,
            status: leave.status,
            start_date: leave.start_date,
          }))
        );
        return;
      }

      const { count: empCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      setTotalEmployees(empCount || 0);

      const today = new Date().toISOString().split('T')[0];
      const { count: presentCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .not('clock_in', 'is', null);
      setPresentToday(presentCount || 0);

      const { count: leaveCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');
      setPendingLeaves(leaveCount || 0);

      const { data: employees } = await supabase
        .from('employees')
        .select('department');
      if (employees) {
        const deptMap: Record<string, number> = {};
        employees.forEach((emp) => {
          deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
        });
        setDepartmentData(
          Object.entries(deptMap).map(([name, value]) => ({
            name,
            value,
            color: departmentColors[name] || '#94a3b8',
          }))
        );
      }

      const { data: recentEmps } = await supabase
        .from('employees')
        .select('name, department, join_date')
        .order('created_at', { ascending: false })
        .limit(4);
      setRecentEmployees(recentEmps || []);

      const { data: recentLvs } = await supabase
        .from('leave_requests')
        .select('type, status, start_date, employee_id')
        .order('id', { ascending: false })
        .limit(4);

      if (recentLvs) {
        const enriched = await Promise.all(
          recentLvs.map(async (lv) => {
            const { data: emp } = await supabase
              .from('employees')
              .select('name')
              .eq('id', lv.employee_id)
              .single();
            return {
              employee_name: emp?.name || 'Unknown',
              type: lv.type,
              status: lv.status,
              start_date: lv.start_date,
            };
          })
        );
        setRecentLeaves(enriched);
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
  const heroDescription = isEmployee
    ? 'Quickly check your leave, attendance, and personal updates. Everything you need is a click away.'
    : 'Stay on top of employee activity, approvals, and insights with a clean, powerful interface.';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isEmployee) {
    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-950 via-blue-900 to-cyan-600 p-8 shadow-2xl text-white">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.35),_transparent_35%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.6fr_0.9fr] items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/90">Human Resource Management</p>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">{heroTitle}</h1>
              <p className="mt-4 max-w-2xl text-sm md:text-base text-cyan-100/90">{heroSubtitle}</p>
              <p className="mt-4 max-w-2xl text-sm text-cyan-100/80">{heroDescription}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" className="min-w-[10rem]" onClick={() => navigate('/self-service')}>
                  Open my portal
                </Button>
                <Button variant="outline" className="min-w-[10rem] text-white border-white/30 hover:border-white" onClick={() => navigate('/attendance')}>
                  View attendance
                </Button>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-lg">
              <div className="mb-5">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-100/70">Today’s snapshot</p>
                <h2 className="mt-3 text-2xl font-semibold dark:text-white">Fast access to what matters</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl bg-slate-950/80 p-4">
                  <p className="text-sm text-cyan-200">Pending leave</p>
                  <p className="mt-2 text-3xl font-semibold">{pendingLeaves}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-4">
                  <p className="text-sm text-cyan-200">Days present this month</p>
                  <p className="mt-2 text-3xl font-semibold">{daysPresentThisMonth}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {employeeStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-2 break-words">{stat.value}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.helper}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Go straight to the tools you use most.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/self-service?tab=my-leave')}>
                <Calendar className="w-4 h-4 mr-2" />
                Request or review leave
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/attendance')}>
                <UserCheck className="w-4 h-4 mr-2" />
                View my attendance
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/self-service?tab=documents')}>
                <FileText className="w-4 h-4 mr-2" />
                Open my documents
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
                You currently have <span className="font-semibold text-gray-800 dark:text-gray-200">{approvedPersonalLeaves}</span> approved leave request{approvedPersonalLeaves === 1 ? '' : 's'} on record.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Leave Updates</CardTitle>
              <CardDescription>Your latest leave activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLeaves.length > 0 ? recentLeaves.map((lv, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 dark:bg-slate-900 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{lv.type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{lv.start_date}</p>
                    </div>
                    <Badge variant={lv.status === 'Approved' ? 'default' : lv.status === 'Rejected' ? 'destructive' : 'secondary'}>
                      {lv.status}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No leave updates yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
                  {stat.change && (
                    <Badge variant="secondary" className="mt-2">
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
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
            ) : (
              <p className="text-gray-400 text-center py-12">No employee data yet. Add employees to see the distribution.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
            <CardDescription>Latest leave activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeaves.length > 0 ? recentLeaves.map((lv, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{lv.employee_name}</p>
                    <p className="text-sm text-gray-500">{lv.type}</p>
                  </div>
                  <Badge variant={lv.status === 'Approved' ? 'default' : lv.status === 'Rejected' ? 'destructive' : 'secondary'}>
                    {lv.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-gray-400 text-sm text-center py-4">No leave requests yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Added Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEmployees.length > 0 ? recentEmployees.map((emp, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{emp.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{emp.department}</p>
                </div>
                <span className="text-xs text-gray-400">{emp.join_date}</span>
              </div>
            )) : (
              <p className="text-gray-400 text-sm text-center py-4">No employees added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
