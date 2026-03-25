import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Clock, Calendar, TrendingUp, DollarSign, UserCheck, AlertCircle, Award } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');
  const isHRorAdmin = user?.role === 'HR' || user?.role === 'Admin';

  const stats = [
    { title: 'Total Employees', value: '247', icon: Users, change: '+12', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Present Today', value: '234', icon: UserCheck, change: '94.7%', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Pending Leaves', value: '18', icon: Calendar, change: '8 urgent', color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Open Positions', value: '12', icon: TrendingUp, change: '+3 new', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const attendanceData = [
    { name: 'Mon', present: 240, absent: 7, leave: 5 },
    { name: 'Tue', present: 238, absent: 6, leave: 8 },
    { name: 'Wed', present: 242, absent: 3, leave: 7 },
    { name: 'Thu', present: 234, absent: 8, leave: 10 },
    { name: 'Fri', present: 236, absent: 5, leave: 11 },
  ];

  const departmentData = [
    { name: 'IT', value: 45, color: '#3b82f6' },
    { name: 'Sales', value: 68, color: '#10b981' },
    { name: 'HR', value: 22, color: '#f59e0b' },
    { name: 'Finance', value: 34, color: '#8b5cf6' },
    { name: 'Marketing', value: 38, color: '#ec4899' },
    { name: 'Operations', value: 40, color: '#06b6d4' },
  ];

  const recentActivities = [
    { action: 'New Employee Onboarded', user: 'Sarah Williams', time: '2 hours ago', icon: Users },
    { action: 'Leave Request Approved', user: 'Michael Brown', time: '3 hours ago', icon: Calendar },
    { action: 'Performance Review Completed', user: 'Emily Davis', time: '5 hours ago', icon: Award },
    { action: 'Payroll Processed', user: 'HR Department', time: '1 day ago', icon: DollarSign },
  ];

  const pendingTasks = [
    { task: 'Approve 8 leave requests', priority: 'High', dueDate: 'Today' },
    { task: 'Complete performance reviews (5 pending)', priority: 'Medium', dueDate: 'Mar 20' },
    { task: 'Process March payroll', priority: 'High', dueDate: 'Mar 25' },
    { task: 'Interview 3 candidates', priority: 'Medium', dueDate: 'Mar 18' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your HR operations</p>
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
                  <Badge variant="secondary" className="mt-2">
                    {stat.change}
                  </Badge>
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
        {/* Weekly Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Employee presence tracking for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="leave" fill="#f59e0b" name="On Leave" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest HR actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <activity.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${task.priority === 'High' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.task}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Leave Utilization</span>
                <span className="text-sm text-gray-500">68%</span>
              </div>
              <Progress value={68} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Training Completion</span>
                <span className="text-sm text-gray-500">82%</span>
              </div>
              <Progress value={82} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Performance Reviews</span>
                <span className="text-sm text-gray-500">45%</span>
              </div>
              <Progress value={45} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
