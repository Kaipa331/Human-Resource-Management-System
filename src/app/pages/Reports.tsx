import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, FileText, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function Reports() {
  const [headcountData, setHeadcountData] = useState([
    { month: 'Jan', employees: 242, hired: 8, left: 3 },
    { month: 'Feb', employees: 247, hired: 7, left: 2 },
    { month: 'Mar', employees: 252, hired: 9, left: 4 },
    { month: 'Apr', employees: 257, hired: 6, left: 1 },
    { month: 'May', employees: 262, hired: 8, left: 3 },
    { month: 'Jun', employees: 267, hired: 7, left: 2 },
  ]);

  const [turnoverData, setTurnoverData] = useState([
    { department: 'IT', rate: 8.5, color: '#3b82f6' },
    { department: 'Sales', rate: 12.3, color: '#10b981' },
    { department: 'HR', rate: 4.2, color: '#f59e0b' },
    { department: 'Finance', rate: 6.1, color: '#8b5cf6' },
    { department: 'Marketing', rate: 9.8, color: '#ec4899' },
  ]);

  const [leaveData, setLeaveData] = useState([
    { type: 'Annual', count: 145, color: '#3b82f6' },
    { type: 'Sick', count: 78, color: '#10b981' },
    { type: 'Emergency', count: 23, color: '#f59e0b' },
    { type: 'Maternity', count: 12, color: '#8b5cf6' },
    { type: 'Paternity', count: 8, color: '#ec4899' },
  ]);

  const [payrollTrend, setPayrollTrend] = useState([
    { month: 'Jan', gross: 206400000, net: 165120000 },
    { month: 'Feb', gross: 208800000, net: 167040000 },
    { month: 'Mar', gross: 210450000, net: 168360000 },
    { month: 'Apr', gross: 214200000, net: 171360000 },
    { month: 'May', gross: 218400000, net: 174720000 },
    { month: 'Jun', gross: 222600000, net: 178080000 },
  ]);

  const reports = [
    {
      id: 1,
      title: 'Monthly Headcount Report',
      description: 'Detailed employee count by department and location',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      id: 2,
      title: 'Payroll Summary Report',
      description: 'Complete payroll breakdown with statutory deductions',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      id: 3,
      title: 'Attendance Report',
      description: 'Employee attendance and punctuality metrics',
      icon: Calendar,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      id: 4,
      title: 'Leave Analysis Report',
      description: 'Leave utilization and balance by type',
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      id: 5,
      title: 'Performance Review Report',
      description: 'Performance ratings and goal achievement summary',
      icon: TrendingUp,
      color: 'text-pink-600',
      bg: 'bg-pink-50'
    },
    {
      id: 6,
      title: 'Training Completion Report',
      description: 'Training enrollment and completion statistics',
      icon: FileText,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
  ];

  const handleDownloadReport = (reportTitle: string) => {
    toast.success(`Generated ${reportTitle}`);
  };

  useEffect(() => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const loadReportsData = async () => {
      try {
        const [{ data: employees }, { data: leaves }, { data: payroll }] = await Promise.all([
          supabase.from('employees').select('id, department, join_date, status'),
          supabase.from('leave_requests').select('type'),
          supabase.from('payroll').select('period, basics, bonuses, net_pay'),
        ]);

        if (employees && employees.length > 0) {
          const monthly = new Map<number, { employees: number; hired: number; left: number }>();
          for (let i = 0; i < 12; i++) monthly.set(i, { employees: 0, hired: 0, left: 0 });

          const hiredByMonth = new Array<number>(12).fill(0);
          for (const emp of employees as any[]) {
            const joinDate = emp.join_date ? new Date(emp.join_date) : null;
            if (joinDate && !Number.isNaN(joinDate.getTime())) {
              hiredByMonth[joinDate.getMonth()] += 1;
            }
          }

          let cumulative = 0;
          for (let i = 0; i < 12; i++) {
            cumulative += hiredByMonth[i];
            const entry = monthly.get(i)!;
            entry.employees = cumulative;
            entry.hired = hiredByMonth[i];
            // No termination date exists in schema; use inactive statuses as directional estimate.
            entry.left = (employees as any[]).filter((e) => String(e.status || '').toLowerCase() !== 'active').length;
          }

          const currentMonth = new Date().getMonth();
          const lastSix = [];
          for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            const m = monthly.get(monthIndex)!;
            lastSix.push({ month: monthLabels[monthIndex], employees: m.employees, hired: m.hired, left: m.left });
          }
          setHeadcountData(lastSix);

          const byDepartment = new Map<string, { total: number; inactive: number }>();
          for (const emp of employees as any[]) {
            const dept = emp.department || 'Unknown';
            if (!byDepartment.has(dept)) byDepartment.set(dept, { total: 0, inactive: 0 });
            const d = byDepartment.get(dept)!;
            d.total += 1;
            if (String(emp.status || '').toLowerCase() !== 'active') d.inactive += 1;
          }
          setTurnoverData(Array.from(byDepartment.entries()).map(([department, v], index) => ({
            department,
            rate: v.total ? Number(((v.inactive / v.total) * 100).toFixed(1)) : 0,
            color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][index % 6],
          })));
        }

        if (leaves && leaves.length > 0) {
          const byType = new Map<string, number>();
          for (const lv of leaves as any[]) {
            const raw = String(lv.type || 'Other');
            const key = raw.replace(' Leave', '').trim() || 'Other';
            byType.set(key, (byType.get(key) || 0) + 1);
          }
          setLeaveData(Array.from(byType.entries()).map(([type, count], index) => ({
            type,
            count,
            color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][index % 6],
          })));
        }

        if (payroll && payroll.length > 0) {
          const byPeriod = new Map<string, { gross: number; net: number }>();
          for (const row of payroll as any[]) {
            const period = String(row.period || 'Unknown');
            if (!byPeriod.has(period)) byPeriod.set(period, { gross: 0, net: 0 });
            const p = byPeriod.get(period)!;
            p.gross += Number(row.basics ?? 0) + Number(row.bonuses ?? 0);
            p.net += Number(row.net_pay ?? 0);
          }
          const payrollRows = Array.from(byPeriod.entries())
            .map(([period, v]) => ({ month: period.slice(0, 3), gross: v.gross, net: v.net }))
            .slice(-6);
          if (payrollRows.length > 0) setPayrollTrend(payrollRows);
        }
      } catch (err) {
        console.error('Error loading report analytics', err);
      }
    };

    loadReportsData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">Generate comprehensive HR reports and insights</p>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className={`p-3 ${report.bg} rounded-lg w-fit mb-4`}>
                <report.icon className={`w-6 h-6 ${report.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{report.description}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => handleDownloadReport(report.title)}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Headcount Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Headcount Trend (6 Months)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Headcount Trend Export')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={headcountData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="employees" stroke="#3b82f6" strokeWidth={2} name="Total Employees" />
              <Line type="monotone" dataKey="hired" stroke="#10b981" strokeWidth={2} name="Hired" />
              <Line type="monotone" dataKey="left" stroke="#ef4444" strokeWidth={2} name="Left" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnover Rate by Department */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Turnover Rate by Department</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Turnover Rate Export')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={turnoverData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rate" fill="#3b82f6" name="Turnover Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Leave Distribution (Current Year)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Leave Distribution Export')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {leaveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Trend (MWK)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Payroll Trend Export')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payrollTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `MWK ${(value / 1000000).toFixed(1)}M`}
              />
              <Legend />
              <Bar dataKey="gross" fill="#3b82f6" name="Gross Payroll" />
              <Bar dataKey="net" fill="#10b981" name="Net Payroll" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Statutory Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Statutory Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">PAYE Tax Report - March 2026</h4>
                <p className="text-sm text-gray-500">Malawi Revenue Authority (MRA) submission</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDownloadReport('PAYE Tax Report')}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Pension Contributions Report - March 2026</h4>
                <p className="text-sm text-gray-500">Employee and employer contributions summary</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDownloadReport('Pension Contributions Report')}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Employment Act Compliance Report</h4>
                <p className="text-sm text-gray-500">Leave balances, working hours, and overtime</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDownloadReport('Employment Act Compliance Report')}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
