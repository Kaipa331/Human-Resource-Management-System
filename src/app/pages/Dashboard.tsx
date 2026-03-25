import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Clock, Calendar, TrendingUp, DollarSign, UserCheck, AlertCircle, Award, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

export function Dashboard() {
  const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');

  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [departmentData, setDepartmentData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<{ name: string; department: string; join_date: string }[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<{ employee_name: string; type: string; status: string; start_date: string }[]>([]);

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

      // 1. Total employees
      const { count: empCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      setTotalEmployees(empCount || 0);

      // 2. Present today (attendance records for today)
      const today = new Date().toISOString().split('T')[0];
      const { count: presentCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .not('clock_in', 'is', null);
      setPresentToday(presentCount || 0);

      // 3. Pending leave requests
      const { count: leaveCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');
      setPendingLeaves(leaveCount || 0);

      // 4. Department distribution
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

      // 5. Recent employees (last 4 added)
      const { data: recentEmps } = await supabase
        .from('employees')
        .select('name, department, join_date')
        .order('created_at', { ascending: false })
        .limit(4);
      setRecentEmployees(recentEmps || []);

      // 6. Recent leave requests (last 4)
      const { data: recentLvs } = await supabase
        .from('leave_requests')
        .select('type, status, start_date, employee_id')
        .order('id', { ascending: false })
        .limit(4);

      if (recentLvs) {
        // Resolve employee names
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your HR operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
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
        {/* Department Distribution */}
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

        {/* Recent Leave Requests */}
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

      {/* Recent Employees */}
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
                  <p className="text-sm text-gray-500">{emp.department}</p>
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
