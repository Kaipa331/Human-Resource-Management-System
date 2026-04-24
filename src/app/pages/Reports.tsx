import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, FileText, TrendingUp, Users, DollarSign, Calendar, Upload, FileUp, Loader2, Activity, PieChart as PieChartIcon, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { domToPng } from 'modern-screenshot';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Loader from '../components/ui/Loader';
import { ReportsService } from '../../lib/reportsService';

export function Reports() {
  const [headcountData, setHeadcountData] = useState([]);
  const [turnoverData, setTurnoverData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadedReports, setUploadedReports] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [allReportData, setAllReportData] = useState<any>(null);

  const handleDownloadReport = async (title: string) => {
    const toastId = toast.loading(`Generating ${title}...`);
    try {
      setIsGenerating(true);
      setGeneratingType(title);
      
      // Allow time for the hidden template to render with data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const elementId = 'special-report-view';
      const element = document.getElementById(elementId);
      
      if (!element) {
        throw new Error('Report container not found');
      }

      const dataUrl = await domToPng(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        quality: 1,
        features: {
          webfont: true,
          image: true,
        }
      });
      
      if (!dataUrl) {
        throw new Error('Failed to capture report content');
      }

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width / 2, img.height / 2]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width / 2, img.height / 2);
      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success(`${title} generated successfully`, { id: toastId });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(`Report generation failed: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
    }
  };

  const forceDownload = async (url: string, filename: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file (${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const loadUploadedReports = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .list('reports', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        if (error.message.includes('bucket')) return;
        throw error;
      }

      const reports = data?.map(file => ({
        name: file.name,
        path: `reports/${file.name}`,
        url: supabase.storage.from('reports').getPublicUrl(`reports/${file.name}`).data.publicUrl,
        uploadedAt: file.created_at || new Date().toISOString(),
        size: file.metadata?.size || 0
      })) || [];

      setUploadedReports(reports);
    } catch (error) {
      console.error('Error loading uploaded reports:', error);
    }
  };

  const reportsList = [
    { id: 1, title: 'Monthly Headcount Report', description: 'Detailed employee count by department', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 2, title: 'Payroll Summary Report', description: 'Complete payroll breakdown and tax breakdown', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 3, title: 'Attendance Report', description: 'Employee attendance and punctuality records', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 4, title: 'Leave Analysis Report', description: 'Comprehensive leave utilization tracking', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 5, title: 'Performance Review Report', description: 'Rating distribution and goal achievements', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 6, title: 'Compliance Audit Report', description: 'Statutory compliance and audit summary', icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      // Note: Ensure 'reports' bucket exists in Supabase Storage with public access
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('bucket')) {
          toast.error('Reports storage bucket not configured. Please contact administrator.');
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath);

      // Save to a reports table if exists, or just store locally
      setUploadedReports(prev => [...prev, {
        name: file.name,
        path: filePath,
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
        size: file.size
      }]);

      toast.success('Report uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload report: ' + error.message);
    } finally {
      setUploading(false);
    }
  };


  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
            entry.left = (employees as any[]).filter((e) => String(e.status || '').toLowerCase() !== 'active').length;
          }

          const currentMonth = new Date().getMonth();
          const lastSix = [];
          for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            const m = monthly.get(monthIndex)!;
            lastSix.push({ month: monthLabels[monthIndex], employees: m.employees, hired: m.hired, left: m.left });
          }
          setHeadcountData(lastSix as any);

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
          })) as any);
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
          })) as any);
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
          if (payrollRows.length > 0) setPayrollTrend(payrollRows as any);
        }

        // Fetch comprehensive data for targeted reports
        const fullReport = await ReportsService.generateHRReport();
        setAllReportData(fullReport);

        await loadUploadedReports();
      } catch (err) {
        console.error('Error loading reports data', err);
        toast.error('Failed to load analytical data');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  if (loading) {
    return <Loader fullScreen text="Analyzing organizational data..." size="lg" />;
  }

  return (
    <div id="report-content" className="space-y-8 pb-12 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Reports & Insights</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">Generate boardroom-ready analytics and compliance data.</p>
        </div>
        {!isGenerating && (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-200 dark:border-slate-800 h-11 w-full sm:w-auto"
              onClick={() => handleDownloadReport('Full Workspace Analytics')}
              disabled={isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              Full Bundle
            </Button>
            <div className="relative group">
              <input
                type="file"
                id="report-upload-main"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              />
              <Button 
                className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 h-11 w-full sm:w-auto"
                onClick={() => document.getElementById('report-upload-main')?.click()}
                disabled={uploading || isGenerating}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileUp className="w-4 h-4 mr-2" />}
                Upload Custom
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Report Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {reportsList.map((report) => (
          <div key={report.id} className="group relative bg-white dark:bg-slate-950 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-5 md:p-8 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${report.bg} opacity-10 rounded-bl-[5rem] group-hover:scale-125 transition-transform duration-700`} />
            
            <div className="relative z-10">
              <div className={`w-12 h-12 md:w-14 md:h-14 ${report.bg} ${report.color} rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm`}>
                <report.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">{report.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 md:mb-8">{report.description}</p>
              
              {!isGenerating && (
                <Button 
                  variant="outline" 
                  className="w-full rounded-2xl border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 group-hover:shadow-md transition-all font-bold"
                  onClick={() => handleDownloadReport(report.title)}
                  disabled={isGenerating}
                >
                  <Download className="w-4 h-4 mr-2 text-blue-600" />
                  Generate Now
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* High-Impact Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Headcount Performance */}
        <Card className="rounded-[2rem] md:rounded-[2.5rem] border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <CardHeader className="px-5 pt-5 pb-4 md:px-8 md:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Headcount Velocity</CardTitle>
                <p className="text-sm text-slate-500 font-medium tracking-tight">Active workforce vs recruitment pipeline</p>
              </div>
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 md:px-8 md:pb-8">
            <div className="h-[240px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={headcountData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748B'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748B'}} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="smooth" dataKey="employees" stroke="#3b82f6" strokeWidth={4} dot={{r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} name="Capacity" />
                  <Line type="smooth" dataKey="hired" stroke="#10b981" strokeWidth={3} dot={false} name="Velocity" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leave Archetypes */}
        <Card className="rounded-[2rem] md:rounded-[2.5rem] border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <CardHeader className="px-5 pt-5 pb-4 md:px-8 md:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Leave Ecosystem</CardTitle>
                <p className="text-sm text-slate-500 font-medium tracking-tight">Distribution by leave archetypes</p>
              </div>
              <PieChartIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 md:px-8 md:pb-8">
            <div className="h-[240px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="count"
                  >
                    {leaveData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Momentum */}
      <Card className="rounded-[2rem] md:rounded-[2.5rem] border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <CardHeader className="px-5 pt-5 pb-4 md:px-8 md:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Payroll Momentum</CardTitle>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Gross vs Net expenditure trend</p>
            </div>
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 md:px-8 md:pb-8">
          <div className="h-[260px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748B'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748B'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => `MK ${(value / 1000000).toFixed(2)}M`}
                  contentStyle={{borderRadius: '16px', border: 'none'}} 
                />
                <Legend verticalAlign="top" align="right" height={36}/>
                <Bar dataKey="gross" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Gross Commitment" barSize={32} />
                <Bar dataKey="net" fill="#10b981" radius={[6, 6, 0, 0]} name="Net Disbursement" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Custom Reports Vault */}
      {uploadedReports.length > 0 && (
        <Card className="rounded-[2rem] md:rounded-[2.5rem] border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <CardHeader className="p-5 md:p-8">
            <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Strategic Document Vault</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 md:px-8 md:pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedReports.map((report, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{report.name}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        {new Date(report.uploadedAt).toLocaleDateString()} • {(report.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full sm:w-auto rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-none"
                    onClick={async () => {
                      try {
                        await forceDownload(report.url, report.name);
                        toast.success('Report downloaded successfully');
                      } catch (error: any) {
                        console.error('Report download failed', error);
                        toast.error(`Failed to download report: ${error.message || 'Unknown error'}`);
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Professional Report Template for PDF Export */}
      <div 
        id="special-report-view" 
        className="fixed left-[-9999px] top-[-9999px] w-[1000px] bg-white p-16 text-slate-900 font-sans"
        style={{ visibility: isGenerating ? 'visible' : 'hidden' }}
      >
        <div className="flex justify-between items-start mb-16 border-b-2 border-slate-900 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tighter uppercase">Lumina <span className="text-blue-600">HR</span></span>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Strategic Human Capital Analytics</p>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-black tracking-tightest uppercase mb-2">{generatingType || 'Report Detail'}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Generated: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="text-slate-400 font-medium text-[9px] mt-1 tracking-tighter">REF: LHR-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>

        {/* Multi-section conditional rendering for Full Workspace or targeted reports */}
        {(generatingType === 'Monthly Headcount Report' || generatingType === 'Full Workspace Analytics') && allReportData && (
          <div className="space-y-10 mb-16">
             <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 border-b pb-2">I. Headcount & Talent Capacity</h2>
             <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="p-6 bg-blue-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Total Talent</p>
                   <p className="text-3xl font-black">{allReportData.employees.total}</p>
                </div>
                <div className="p-6 bg-emerald-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Active Pulse</p>
                   <p className="text-3xl font-black">{allReportData.employees.active}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Ecosystem Units</p>
                   <p className="text-3xl font-black">{Object.keys(allReportData.employees.byDepartment).length}</p>
                </div>
             </div>
             
             <table className="w-full border-collapse">
                <thead>
                   <tr className="border-b-2 border-slate-900">
                      <th className="py-4 text-left font-black uppercase tracking-widest text-xs">Department Unit</th>
                      <th className="py-4 text-right font-black uppercase tracking-widest text-xs">Headcount</th>
                      <th className="py-4 text-right font-black uppercase tracking-widest text-xs">% of Org</th>
                   </tr>
                </thead>
                <tbody>
                   {Object.entries(allReportData.employees.byDepartment).map(([dept, count]: any, i) => (
                      <tr key={i} className="border-b border-slate-100">
                         <td className="py-4 font-bold text-slate-800">{dept}</td>
                         <td className="py-4 text-right font-black">{count}</td>
                         <td className="py-4 text-right font-medium text-slate-500">
                            {((count / allReportData.employees.total) * 100).toFixed(1)}%
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {(generatingType === 'Payroll Summary Report' || generatingType === 'Full Workspace Analytics') && allReportData && (
          <div className="space-y-10 mb-16">
             <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 border-b pb-2">II. Financial Commitment & Momentum</h2>
             <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="p-6 bg-blue-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Gross Commitment</p>
                   <p className="text-3xl font-black">MK {(allReportData.payroll.totalGross / 1000000).toFixed(2)}M</p>
                </div>
                <div className="p-6 bg-emerald-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Net Disbursement</p>
                   <p className="text-3xl font-black">MK {(allReportData.payroll.totalNet / 1000000).toFixed(2)}M</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Total Statutory Tax</p>
                   <p className="text-3xl font-black">MK {(allReportData.payroll.totalTax / 1000000).toFixed(2)}M</p>
                </div>
             </div>
             
             <table className="w-full border-collapse">
                <thead>
                   <tr className="border-b-2 border-slate-900">
                      <th className="py-4 text-left font-black uppercase tracking-widest text-xs">Department</th>
                      <th className="py-4 text-right font-black uppercase tracking-widest text-xs">Total Net (MK)</th>
                      <th className="py-4 text-right font-black uppercase tracking-widest text-xs">Staffing</th>
                      <th className="py-4 text-right font-black uppercase tracking-widest text-xs">Avg Salary (MK)</th>
                   </tr>
                </thead>
                <tbody>
                   {Object.entries(allReportData.payroll.byDepartment).map(([dept, data]: any, i) => (
                      <tr key={i} className="border-b border-slate-100">
                         <td className="py-4 font-bold text-slate-800">{dept}</td>
                         <td className="py-4 text-right font-black">{(data.net / 1000).toFixed(1)}K</td>
                         <td className="py-4 text-right font-medium">{data.employees}</td>
                         <td className="py-4 text-right font-medium text-slate-500">
                            {(data.net / data.employees / 1000).toFixed(1)}K
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {(generatingType === 'Leave Analysis Report' || generatingType === 'Full Workspace Analytics') && allReportData && (
          <div className="space-y-10">
             <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 border-b pb-2">III. Attendance Ecosystem & Utilization</h2>
             <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-blue-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Avg Attendance Rate</p>
                   <p className="text-3xl font-black">{allReportData.attendance.averageAttendance}%</p>
                </div>
                <div className="p-6 bg-rose-50 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Total Absenteeism</p>
                   <p className="text-3xl font-black">{allReportData.attendance.absentDays} Days</p>
                </div>
             </div>
             
             <table className="w-full border-collapse">
                <thead>
                   <tr className="border-b-2 border-slate-900">
                      <th className="py-4 text-left font-black uppercase tracking-widest text-xs">Department Unit</th>
                      <th className="py-4 text-right font-black uppercase tracking-widest text-xs">Attendance %</th>
                      <th className="py-4 text-right font-black uppercase tracking-widest text-xs">Status</th>
                   </tr>
                </thead>
                <tbody>
                   {Object.entries(allReportData.attendance.byDepartment).map(([dept, rate]: any, i) => (
                      <tr key={i} className="border-b border-slate-100">
                         <td className="py-4 font-bold text-slate-800">{dept}</td>
                         <td className="py-4 text-right font-black">{rate}%</td>
                         <td className="py-4 text-right">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${rate > 95 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                               {rate > 95 ? 'Excellent' : 'Stable'}
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        <div className="mt-auto pt-20 border-t border-slate-100 text-center">
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Confidential Property of Lumina HR Systems • Internal Distribution Only</p>
        </div>
      </div>
    </div>
  );
}
