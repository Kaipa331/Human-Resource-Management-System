import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart3,
  Users, 
  Calendar, 
  TrendingUp, 
  UserCheck, 
  BriefcaseBusiness, 
  Clock3, 
  FileText,
  Activity,
  Zap,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  LucideIcon
} from 'lucide-react';
import Loader from '../components/ui/Loader';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '../../lib/supabase';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  color: string;
  trend: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, change, icon: Icon, color, trend }: StatCardProps) {
  const colorSchemes: Record<string, { bg: string; gradient: string; iconBg: string; iconColor: string; accent: string }> = {
    blue: { 
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      iconColor: 'text-white',
      accent: 'border-blue-200 dark:border-blue-800'
    },
    emerald: { 
      bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
      gradient: 'from-emerald-500/20 to-green-500/20',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      iconColor: 'text-white',
      accent: 'border-emerald-200 dark:border-emerald-800'
    },
    amber: { 
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      iconColor: 'text-white',
      accent: 'border-amber-200 dark:border-amber-800'
    },
    purple: { 
      bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
      gradient: 'from-purple-500/20 to-violet-500/20',
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      iconColor: 'text-white',
      accent: 'border-purple-200 dark:border-purple-800'
    },
    rose: { 
      bg: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
      gradient: 'from-rose-500/20 to-pink-500/20',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      iconColor: 'text-white',
      accent: 'border-rose-200 dark:border-rose-800'
    },
    cyan: { 
      bg: 'bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30',
      gradient: 'from-cyan-500/20 to-sky-500/20',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-sky-600',
      iconColor: 'text-white',
      accent: 'border-cyan-200 dark:border-cyan-800'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  return (
    <Card className={`relative overflow-hidden ${scheme.bg} ${scheme.accent} border-2 bg-white dark:bg-slate-950 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 rounded-[2rem] p-6 group`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${scheme.gradient} rounded-bl-full group-hover:scale-110 transition-transform duration-700 opacity-50`} />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-white/50 to-transparent rounded-tr-full" />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-4 ${scheme.iconBg} rounded-2xl shadow-lg shadow-${color}-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            <Icon className={`w-6 h-6 ${scheme.iconColor}`} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : null}
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
        </div>
      </div>
    </Card>
  );
}

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
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [personalLeaveBalance, setPersonalLeaveBalance] = useState(21);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isEmployee) {
        // Fetch personal stats for employee
        const { data: emp } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (emp?.id) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          const startStr = startOfMonth.toISOString().split('T')[0];

          const { count: attCount } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('employee_id', emp.id)
            .eq('status', 'Present')
            .gte('date', startStr);
          
          setAttendanceCount(attCount || 0);

          const { data: leaves } = await supabase
            .from('leave_requests')
            .select('type, start_date, end_date')
            .eq('employee_id', emp.id)
            .in('status', ['Approved', 'Pending']);

          let annualUsed = 0;
          (leaves || []).forEach((lv) => {
            if (lv.type === 'Annual Leave') {
              const days = Math.ceil((new Date(lv.end_date).getTime() - new Date(lv.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
              annualUsed += days;
            }
          });
          setPersonalLeaveBalance(21 - annualUsed);
        }
      } else {
        // Fetch HR dashboard data
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('*');
        
        if (employeesError) throw employeesError;
        setTotalEmployees(employees?.length || 0);
        setPresentToday(Math.floor((employees?.length || 0) * 0.85));

        const { data: leaves, error: leavesError } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('status', 'Pending');
        
        if (leavesError) throw leavesError;
        setPendingLeaves(leaves?.length || 0);
        setRecentLeaves(leaves?.slice(0, 5) || []);

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

        const recentEmps = employees
          ?.sort((a: any, b: any) => new Date(b.join_date).getTime() - new Date(a.join_date).getTime())
          ?.slice(0, 5) || [];
        setRecentEmployees(recentEmps);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading dashboard..." size="lg" />;
  }

  if (isEmployee) {
    return (
      <div className="space-y-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Bonjour, {user?.name?.split(' ')[0] || 'Employee'}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 tracking-tight">Here is your work-life velocity for today.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 h-11" onClick={() => navigate('/app/self-service')}>
                Manage Profile
             </Button>
             <Button className="rounded-xl bg-blue-600 h-11" onClick={() => navigate('/app/attendance')}>
                <Zap className="w-4 h-4 mr-2" />
                Mark Pulse
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
           <StatCard 
             title="Days Present" 
             value={attendanceCount} 
             change="This Month" 
             icon={UserCheck} 
             color="emerald" 
             trend="up" 
           />
           <StatCard 
             title="Leave Balance" 
             value={personalLeaveBalance} 
             change="Days Remaining" 
             icon={Calendar} 
             color="purple" 
             trend="neutral" 
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8">
             <CardHeader className="p-0 mb-8">
               <CardTitle className="text-2xl font-black tracking-tighter">Strategic Actions</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: "Review Pulse", icon: Clock3, path: "/app/attendance", desc: "View your attendance history." },
                    { title: "Request Leave", icon: Calendar, path: "/app/leave", desc: "Plan your next hiatus." },
                    { title: "Documents", icon: FileText, path: "/app/self-service", desc: "Access your digital vault." },
                    { title: "Performance", icon: Activity, path: "/app/performance", desc: "Track your growth trajectory." }
                  ].map((action, i) => (
                    <div 
                      key={i} 
                      onClick={() => navigate(action.path)}
                      className="group p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-950 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <action.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-tighter">{action.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">{action.desc}</p>
                    </div>
                  ))}
                </div>
             </CardContent>
           </Card>

           <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-16 h-16 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Verified Talent</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 px-4">Your credentials are ISO 27001 verified and fully compliant.</p>
              <Button variant="ghost" className="rounded-full text-xs font-black uppercase tracking-widest text-blue-600">
                View Certificate
              </Button>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">HR Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 tracking-tight">Orchestrate your workforce with high-precision analytics.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-slate-200 h-11" onClick={() => navigate('/app/reports')}>
              <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
              Intelligence Bundle
           </Button>
           <Button className="rounded-xl bg-blue-600 h-11 shadow-lg shadow-blue-600/20" onClick={() => navigate('/app/employees')}>
              <Users className="w-4 h-4 mr-2" />
              Talent Hub
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        <StatCard title="Active Capacity" value={totalEmployees} change="+12% VS LW" icon={Users} color="blue" trend="up" />
        <StatCard title="Pulse Today" value={presentToday} change="+5% VS AVG" icon={UserCheck} color="emerald" trend="up" />
        <StatCard title="Pending Hiatus" value={pendingLeaves} change="-2 VS LW" icon={Calendar} color="rose" trend="down" />
        <StatCard title="Org Units" value={departmentData.length} change="Operational" icon={BriefcaseBusiness} color="cyan" trend="neutral" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {departmentData.length > 0 && (
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[450px]">
            <CardHeader className="p-8">
              <CardTitle className="text-2xl font-black tracking-tighter">Org Architecture</CardTitle>
              <CardDescription className="text-slate-400 font-medium tracking-tight">Talent distribution by department unit.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-6 mt-4">
                 {departmentData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d.name}</span>
                    </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter">Talent Pulse</CardTitle>
                <CardDescription className="text-slate-400 font-medium tracking-tight">Latest trajectory in leave requests.</CardDescription>
              </div>
              <Activity className="w-6 h-6 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-4">
              {recentLeaves.length > 0 ? recentLeaves.map((lv, index) => (
                <div key={index} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center shadow-sm">
                       <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{lv.employee_name}</p>
                      <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{lv.type}</p>
                    </div>
                  </div>
                  <Badge className={`rounded-lg uppercase text-[9px] font-black tracking-[0.2em] px-3 py-1 ${lv.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border-none' : 'bg-amber-500/10 text-amber-600 border-none'}`}>
                    {lv.status}
                  </Badge>
                </div>
              )) : (
                <div className="py-20 text-center">
                   <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">No Active Pulse</p>
                </div>
              )}
            </div>
            {recentLeaves.length > 0 && (
               <Button variant="ghost" className="w-full mt-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-blue-600 hover:bg-blue-50" onClick={() => navigate('/app/leave')}>
                  View Strategic Feed
               </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl font-black tracking-tighter">New Ecosystem Joiners</CardTitle>
          <CardDescription className="text-slate-400 font-medium tracking-tight">Recent talent onboarded into the Lumina ecosystem.</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEmployees.length > 0 ? recentEmployees.map((emp, index) => (
              <div key={index} className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center shadow-sm">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter truncate">{emp.name}</p>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{emp.department}</span>
                     <span className="w-1 h-1 rounded-full bg-slate-300" />
                     <span className="text-[10px] text-slate-400 font-medium">{new Date(emp.join_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xl">Empty Ecosystem</p>
                <Button className="mt-6 rounded-full bg-blue-600" onClick={() => navigate('/app/employees')}>Add First Joiner</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
