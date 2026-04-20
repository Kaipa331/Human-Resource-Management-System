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
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);

  const stats = [
    {
      title: 'Total Employees',
      value: totalEmployees,
      change: '+12%',
      icon: Users,
      bg: 'bg-blue-50',
      color: 'text-blue-600'
    },
    {
      title: 'Present Today',
      value: presentToday,
      change: '+5%',
      icon: UserCheck,
      bg: 'bg-green-50',
      color: 'text-green-600'
    },
    {
      title: 'Pending Leaves',
      value: pendingLeaves,
      change: '-3%',
      icon: Calendar,
      bg: 'bg-yellow-50',
      color: 'text-yellow-600'
    },
    {
      title: 'Departments',
      value: departmentData.length,
      change: '+2',
      icon: BriefcaseBusiness,
      bg: 'bg-purple-50',
      color: 'text-purple-600'
    }
  ];

  const employeeStats = [
    {
      title: 'Days Present',
      value: '22',
      change: 'This month',
      icon: UserCheck,
      bg: 'bg-green-50',
      color: 'text-green-600'
    },
    {
      title: 'Leave Balance',
      value: '12',
      change: 'Days remaining',
      icon: Calendar,
      bg: 'bg-blue-50',
      color: 'text-blue-600'
    }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*');
      
      if (employeesError) throw employeesError;
      setTotalEmployees(employees?.length || 0);
      setPresentToday(Math.floor((employees?.length || 0) * 0.85));

      // Fetch pending leaves
      const { data: leaves, error: leavesError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'Pending');
      
      if (leavesError) throw leavesError;
      setPendingLeaves(leaves?.length || 0);
      setRecentLeaves(leaves?.slice(0, 5) || []);

      // Calculate department data
      const deptCounts = employees?.reduce((acc: any, emp: any) => {
        const dept = emp.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const deptData = Object.entries(deptCounts || {}).map(([name, value], index) => ({
        name,
        value: value as number,
        color: colors[index % colors.length]
      }));
      setDepartmentData(deptData);

      // Get recent employees
      const recentEmps = employees
        ?.sort((a: any, b: any) => new Date(b.join_date).getTime() - new Date(a.join_date).getTime())
        ?.slice(0, 5) || [];
      setRecentEmployees(recentEmps);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isEmployee) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Employee'}</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your work today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employeeStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <p className="text-sm text-gray-400 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => navigate('/app/attendance')}>
                <Clock3 className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
              <Button variant="outline" onClick={() => navigate('/app/leave')}>
                <Calendar className="w-4 h-4 mr-2" />
                Request Leave
              </Button>
              <Button variant="outline" onClick={() => navigate('/app/profile')}>
                <FileText className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
              <Button variant="outline" onClick={() => navigate('/app/documents')}>
                <FileText className="w-4 h-4 mr-2" />
                View Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your workforce and track performance metrics.</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departmentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Employee count by department</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
            <CardDescription>Latest leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeaves.length > 0 ? recentLeaves.map((lv, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
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
          <CardDescription>Latest team members</CardDescription>
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
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400 font-medium">No employees yet</p>
                <p className="text-sm text-gray-500 mt-1">Start adding employees to build your team</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
