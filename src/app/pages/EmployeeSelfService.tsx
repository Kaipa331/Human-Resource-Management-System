import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Mail, Phone, Building, Calendar, Download, Edit, Clock, Clock3, FileText, PlusCircle, Loader2, AlertCircle, BookOpen, Award, GraduationCap, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Switch } from '../components/ui/switch';
import { Progress } from '../components/ui/progress';
import { supabase } from '../../lib/supabase';

interface LeaveRequest {
  id: string;
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
}

interface LeaveBalance {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  emergency: { total: number; used: number; remaining: number };
}

interface MyTraining {
  id: string;
  title: string;
  category: string;
  progress: number;
  status: string;
  dueDate: string;
  completedModules: number;
  totalModules: number;
}

export function EmployeeSelfService() {
  const getStoredUser = () => {
    const raw = localStorage.getItem('hrms_user');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('Invalid hrms_user JSON in localStorage', error);
      return {};
    }
  };
  const user = getStoredUser();
  const canManageLeave = ['HR', 'Admin', 'Manager'].includes(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedTabs = ['personal', 'my-leave', 'my-training', 'payslips', 'attendance', 'documents', 'settings'];
  const currentTabParam = searchParams.get('tab') || 'personal';
  const [activeTab, setActiveTab] = useState(
    allowedTabs.includes(currentTabParam) ? currentTabParam : 'personal'
  );
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const defaultSettings = {
      emailAlerts: true,
      leaveUpdates: true,
      weeklySummary: false,
    };

    if (!user?.email) {
      return defaultSettings;
    }

    const savedSettings = localStorage.getItem(`hrms_notifications_${user.email}`);
    if (!savedSettings) {
      return defaultSettings;
    }

    try {
      return { ...defaultSettings, ...JSON.parse(savedSettings) };
    } catch (error) {
      console.error('Invalid notification settings JSON in localStorage', error);
      return defaultSettings;
    }
  });

  // ─── Training State ─────────────────────────────────────────────────────────
  const [myTrainings, setMyTrainings] = useState<MyTraining[]>([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'personal';
    if (allowedTabs.includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const nextParams = new URLSearchParams(searchParams);

    if (value === 'personal') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', value);
    }

    setSearchParams(nextParams);
  };

  const updateNotificationSetting = (
    key: 'emailAlerts' | 'leaveUpdates' | 'weeklySummary',
    checked: boolean,
  ) => {
    const nextSettings = { ...notificationSettings, [key]: checked };
    setNotificationSettings(nextSettings);

    if (user?.email) {
      localStorage.setItem(`hrms_notifications_${user.email}`, JSON.stringify(nextSettings));
    }
  };

  interface EmployeeProfileData {
    employeeId?: string;
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    position?: string;
    joinDate?: string;
    reportingTo?: string;
    location?: string;
    address?: string;
    emergencyContact?: string;
  }

  const [profileData, setProfileData] = useState<EmployeeProfileData>({
    employeeId: undefined,
    name: user.name || '',
    email: user.email || '',
    phone: '',
    department: user.department || '',
    position: '',
    joinDate: '',
    reportingTo: '',
    location: '',
    address: '',
    emergencyContact: '',
  });

  const loadProfileData = async () => {
    try {
      const emailToQuery = String(user.email || '').toLowerCase();
      if (!emailToQuery) return;

      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', emailToQuery)
        .maybeSingle();

      if (error) {
        console.error('Could not load employee profile data', error);
        return;
      }

      if (employee) {
        setProfileData({
          employeeId: employee.employee_id || undefined,
          name: employee.name || user.name || '',
          email: employee.email || user.email || '',
          phone: employee.phone || '',
          department: employee.department || user.department || '',
          position: employee.position || '',
          joinDate: employee.join_date ? new Date(employee.join_date).toISOString().split('T')[0] : '',
          reportingTo: employee.manager_supervisor || '',
          location: employee.work_location || '',
          address: employee.address || '',
          emergencyContact: employee.emergency_contact_name 
            ? `${employee.emergency_contact_name}${employee.emergency_contact_phone ? ` (${employee.emergency_contact_phone})` : ''}`
            : '',
        });
      }
    } catch (err) {
      console.error('Error loading employee profile data', err);
    }
  };

  // ─── Real Data States ──────────────────────────────────────────────────────
  const [employeeDbId, setEmployeeDbId] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [payslipsLoading, setPayslipsLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const myDocuments = [
    { name: 'Employment Contract', type: 'PDF', uploadDate: '2024-01-15', size: '245 KB' },
    { name: 'Tax Certificate 2025', type: 'PDF', uploadDate: '2026-01-05', size: '128 KB' },
    { name: 'Performance Review Q4 2025', type: 'PDF', uploadDate: '2026-01-20', size: '312 KB' },
    { name: 'ID Copy', type: 'PDF', uploadDate: '2024-01-15', size: '156 KB' },
  ];

  // ─── Leave state ────────────────────────────────────────────────────────────
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    annual: { total: 21, used: 0, remaining: 21 },
    sick: { total: 10, used: 0, remaining: 10 },
    emergency: { total: 3, used: 0, remaining: 3 },
  });
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newLeave, setNewLeave] = useState({ type: '', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    loadProfileData();
    loadLeaveData();
    loadTrainingData();
  }, []);

  const loadLeaveData = async () => {
    setLeaveLoading(true);
    try {
      const emailToQuery = String(user.email || profileData.email || '').toLowerCase();
      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('email', emailToQuery)
        .maybeSingle();

      const resolvedId = emp?.id || null;
      setEmployeeDbId(resolvedId);

      if (resolvedId) {
        await Promise.all([
          fetchLeaveRequests(resolvedId), 
          fetchLeaveBalance(resolvedId),
          fetchPayslips(resolvedId),
          fetchAttendanceHistory(resolvedId)
        ]);
      } else {
        setLeaveRequests([]);
        setPayslips([]);
        setAttendanceHistory([]);
      }
    } catch (err) {
      console.error('Error loading employee data', err);
    } finally {
      setLeaveLoading(false);
    }
  };

  const fetchPayslips = async (empId: string) => {
    try {
      setPayslipsLoading(true);
      // Actual columns found in DB: id, employee_id, cycle_id, pay_period, gross_salary, net_salary, updated_at, etc.
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          id,
          pay_period,
          gross_salary,
          net_salary,
          updated_at
        `)
        .eq('employee_id', empId)
        .order('pay_period', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(p => ({
        id: p.id,
        month: p.pay_period,
        gross: new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(Number(p.gross_salary || 0)),
        net: new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(Number(p.net_salary || 0)),
        date: p.updated_at 
          ? new Date(p.updated_at).toLocaleDateString() 
          : 'Processed'
      }));

      setPayslips(formatted);
    } catch (err) {
      console.error('Error fetching payslips', err);
    } finally {
      setPayslipsLoading(false);
    }
  };


  const fetchAttendanceHistory = async (empId: string) => {
    try {
      setAttendanceLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', empId)
        .order('date', { ascending: false })
        .limit(15);

      if (error) throw error;

      const formatted = (data || []).map(a => {
        let hours = 0;
        let clockInTime = '-';
        let clockOutTime = '-';

        if (a.clock_in) {
          const d = new Date(a.clock_in);
          clockInTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (a.clock_out) {
          const d = new Date(a.clock_out);
          clockOutTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        if (a.clock_in && a.clock_out) {
          const start = new Date(a.clock_in);
          const end = new Date(a.clock_out);
          hours = Number(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1));
        }

        return {
          date: a.date,
          clockIn: clockInTime,
          clockOut: clockOutTime,
          hours,
          status: a.status
        };
      });

      setAttendanceHistory(formatted);
    } catch (err) {
      console.error('Error fetching attendance history', err);
    } finally {
      setAttendanceLoading(false);
    }
  };


  const fetchLeaveRequests = async (empId: string) => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', empId)
      .order('id', { ascending: false });

    if (error) { toast.error('Failed to load leave history'); return; }

    const enriched: LeaveRequest[] = (data || []).map((req) => {
      const start = new Date(req.start_date);
      const end = new Date(req.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return { id: req.id, type: req.type, start_date: req.start_date, end_date: req.end_date, days, reason: req.reason || '', status: req.status };
    });

    setLeaveRequests(enriched);
  };

  const fetchLeaveBalance = async (empId: string) => {
    const { data: requests } = await supabase
      .from('leave_requests')
      .select('type, start_date, end_date, status')
      .eq('employee_id', empId)
      .in('status', ['Approved', 'Pending']);

    let annualUsed = 0, sickUsed = 0, emergencyUsed = 0;
    (requests || []).forEach((lv) => {
      const days = Math.ceil((new Date(lv.end_date).getTime() - new Date(lv.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (lv.type === 'Annual Leave') annualUsed += days;
      else if (lv.type === 'Sick Leave') sickUsed += days;
      else if (lv.type === 'Emergency Leave') emergencyUsed += days;
    });

    setLeaveBalance({
      annual: { total: 21, used: annualUsed, remaining: 21 - annualUsed },
      sick: { total: 10, used: sickUsed, remaining: 10 - sickUsed },
      emergency: { total: 3, used: emergencyUsed, remaining: 3 - emergencyUsed },
    });
  };


  const loadTrainingData = async () => {
    setTrainingLoading(true);
    try {
      const emailToQuery = String(user.email || profileData.email || '').toLowerCase();
      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('email', emailToQuery)
        .maybeSingle();

      if (!emp?.id) {
        setMyTrainings([]);
        return;
      }

      const { data: enrollments } = await supabase
        .from('training_enrollments')
        .select(`
          id,
          progress,
          status,
          due_date,
          completed_modules,
          total_modules,
          training_courses:course_id (
            title,
            category
          )
        `)
        .eq('employee_id', emp.id);

      if (enrollments && enrollments.length > 0) {
        setMyTrainings(enrollments.map((r: any) => ({
          id: r.id,
          title: r.training_courses?.title || 'Untitled Course',
          category: r.training_courses?.category || 'General',
          progress: Number(r.progress ?? 0),
          status: r.status || 'In Progress',
          dueDate: r.due_date || '',
          completedModules: Number(r.completed_modules ?? 0),
          totalModules: Number(r.total_modules ?? 0),
        })));
      } else {
        setMyTrainings([]);
      }
    } catch (err) {
      console.error('Error loading training data', err);
      setMyTrainings([]);
    } finally {
      setTrainingLoading(false);
    }
  };

  const handleContinueTraining = async (training: MyTraining) => {
    try {
      const newModules = Math.min(training.totalModules, training.completedModules + 1);
      const newProgress = Math.round((newModules / training.totalModules) * 100);
      const newStatus = newModules === training.totalModules ? 'Completed' : 'In Progress';

      const { error } = await supabase
        .from('training_enrollments')
        .update({ completed_modules: newModules, progress: newProgress, status: newStatus })
        .eq('id', training.id);

      if (error) throw error;

      setMyTrainings(myTrainings.map(t => t.id === training.id ? {
        ...t, completedModules: newModules, progress: newProgress, status: newStatus
      } : t));

      if (newStatus === 'Completed') {
        toast.success(`Congratulations! You have completed ${training.title}`);
      } else {
        toast.success(`Progress saved! Module ${newModules} completed.`);
      }
    } catch (error: any) {
      toast.error('Error updating progress: ' + error.message);
    }
  };

  const handleSubmitLeave = async () => {
    if (canManageLeave) {
      toast.info('Approver accounts should review leave from the Leave Management screen.');
      return;
    }
    if (!newLeave.type || !newLeave.startDate || !newLeave.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (new Date(newLeave.endDate) < new Date(newLeave.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (!employeeDbId) {
      toast.error('Employee record not found. Please contact HR.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('leave_requests').insert([{
      employee_id: employeeDbId,
      type: newLeave.type,
      start_date: newLeave.startDate,
      end_date: newLeave.endDate,
      reason: newLeave.reason,
      status: 'Pending',
    }]);

    setSubmitting(false);
    if (error) { toast.error('Error submitting leave: ' + error.message); return; }

    toast.success('Leave request submitted successfully!');
    setNewLeave({ type: '', startDate: '', endDate: '', reason: '' });
    setDialogOpen(false);
    await Promise.all([fetchLeaveRequests(employeeDbId), fetchLeaveBalance(employeeDbId)]);
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Late': return 'bg-yellow-100 text-yellow-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'Leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveUsageColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return { text: 'text-blue-600', bg: 'bg-blue-500' };
      case 'green':
        return { text: 'text-green-600', bg: 'bg-green-500' };
      case 'orange':
        return { text: 'text-orange-600', bg: 'bg-orange-500' };
      default:
        return { text: 'text-gray-600 dark:text-gray-300', bg: 'bg-gray-500 dark:bg-gray-600' };
    }
  };

  const computedDays = () => {
    if (!newLeave.startDate || !newLeave.endDate) return 0;
    const diff = new Date(newLeave.endDate).getTime() - new Date(newLeave.startDate).getTime();
    return diff >= 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1 : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Self-Service Portal</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and requests</p>
      </div>

      {/* Profile Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
              {profileData.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{profileData.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{profileData.position}</p>
                  <Badge className="mt-2">{profileData.employeeId}</Badge>
                </div>
                <Button variant="outline" onClick={() => handleTabChange('settings')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Open Settings
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{profileData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{profileData.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{profileData.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Joined {profileData.joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="my-leave">My Leave</TabsTrigger>
          <TabsTrigger value="my-training">My Training</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ── Personal Info ─────────────────────────────────────────────────── */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                  <p className="mt-1 text-lg">{profileData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</label>
                  <p className="mt-1 text-lg">{profileData.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="mt-1 text-lg">{profileData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <p className="mt-1 text-lg">{profileData.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                  <p className="mt-1 text-lg">{profileData.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
                  <p className="mt-1 text-lg">{profileData.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Join Date</label>
                  <p className="mt-1 text-lg">{profileData.joinDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reporting To</label>
                  <p className="mt-1 text-lg">{profileData.reportingTo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Office Location</label>
                  <p className="mt-1 text-lg">{profileData.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                  <p className="mt-1 text-lg">{profileData.address}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Emergency Contact</label>
                  <p className="mt-1 text-lg">{profileData.emergencyContact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── My Leave ──────────────────────────────────────────────────────── */}
        <TabsContent value="my-leave">
          <div className="space-y-6">
            {/* Balance cards + Apply button */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-800">Leave Overview</h2>
              {canManageLeave ? (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Managers approve requests in Leave Management
                </Badge>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button id="apply-leave-btn">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Apply for Leave
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Apply for Leave</DialogTitle>
                      <DialogDescription>Submit a new leave request. It will be reviewed by your manager.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <Label htmlFor="leave-type">Leave Type <span className="text-red-500">*</span></Label>
                        <Select value={newLeave.type} onValueChange={(val) => setNewLeave({ ...newLeave, type: val })}>
                          <SelectTrigger id="leave-type" className="mt-1">
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                            <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                            <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                            <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                            <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                            <SelectItem value="Study Leave">Study Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date">Start Date <span className="text-red-500">*</span></Label>
                          <Input
                            id="start-date"
                            type="date"
                            className="mt-1"
                            value={newLeave.startDate}
                            onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date">End Date <span className="text-red-500">*</span></Label>
                          <Input
                            id="end-date"
                            type="date"
                            className="mt-1"
                            value={newLeave.endDate}
                            onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                      {computedDays() > 0 && (
                        <p className="text-sm text-blue-600 font-medium">
                          Duration: {computedDays()} day{computedDays() !== 1 ? 's' : ''}
                        </p>
                      )}
                      <div>
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                          id="reason"
                          className="mt-1"
                          value={newLeave.reason}
                          onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                          placeholder="Briefly explain the reason for your leave..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <Button
                      id="submit-leave-btn"
                      onClick={handleSubmitLeave}
                      className="mt-2 w-full"
                      disabled={submitting}
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit Request'}
                    </Button>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Leave balance summary */}
            {leaveLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Annual Leave', balance: leaveBalance.annual, color: 'blue' },
                  { label: 'Sick Leave', balance: leaveBalance.sick, color: 'green' },
                  { label: 'Emergency Leave', balance: leaveBalance.emergency, color: 'orange' },
                ].map(({ label, balance, color }) => {
                  const { text, bg } = getLeaveUsageColorClasses(color);
                  return (
                    <Card key={label}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-700">{label}</span>
                          <span className={`text-2xl font-bold ${text}`}>{balance.remaining}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                          <div
                            className={`${bg} h-2 rounded-full transition-all`}
                            style={{ width: `${Math.min((balance.used / balance.total) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{balance.used} used</span>
                          <span>{balance.remaining} of {balance.total} remaining</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Leave history */}
            <Card>
              <CardHeader>
                <CardTitle>My Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                    <AlertCircle className="w-10 h-10" />
                    <p className="text-sm">
                      {canManageLeave
                        ? 'No personal leave requests are linked to this account.'
                        : <>No leave requests yet. Click <strong>Apply for Leave</strong> to get started.</>}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests.map((req) => (
                      <div key={req.id} className="flex items-start justify-between border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{req.type}</span>
                            <Badge className={getLeaveStatusColor(req.status)}>{req.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {req.start_date} → {req.end_date}
                            <span className="ml-2 font-medium text-gray-700">({req.days} day{req.days !== 1 ? 's' : ''})</span>
                          </p>
                          {req.reason && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{req.reason}"</p>
                          )}
                        </div>
                        <Calendar className="w-5 h-5 text-gray-300 mt-1 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── My Training ───────────────────────────────────────────────────── */}
        <TabsContent value="my-training">
          <Card>
            <CardHeader>
              <CardTitle>My Training Programs</CardTitle>
            </CardHeader>
            <CardContent>
              {trainingLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : myTrainings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                  <BookOpen className="w-10 h-10" />
                  <p className="text-sm">
                    No training programs enrolled yet. Visit the <strong>Training & Development</strong> section to enroll in courses.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTrainings.map((training) => (
                    <div key={training.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">{training.title}</h3>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{training.category}</p>
                        </div>
                        <Badge variant={
                          training.status === 'Completed' ? 'default' :
                          training.status === 'In Progress' ? 'secondary' :
                          'outline'
                        }>
                          {training.status}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{training.progress}%</span>
                          </div>
                          <Progress value={training.progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Modules</p>
                            <p className="text-lg font-semibold">{training.completedModules} / {training.totalModules}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                            <p className="font-medium">{training.status}</p>
                          </div>
                          {training.dueDate && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Due Date</p>
                              <p className="font-medium">{new Date(training.dueDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Remaining</p>
                            <p className="font-medium">{training.totalModules - training.completedModules} modules</p>
                          </div>
                        </div>
                      </div>

                      {training.status !== 'Completed' && (
                        <Button 
                          size="sm" 
                          className="mt-4 w-full md:w-auto"
                          onClick={() => handleContinueTraining(training)}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Continue Learning
                        </Button>
                      )}

                      {training.status === 'Completed' && (
                        <div className="mt-4 flex items-center gap-2 text-green-600">
                          <Award className="w-5 h-5" />
                          <span className="font-medium">Completed on {training.dueDate}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payslips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payslipsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : payslips.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No payslips found.</p>
                ) : (
                  payslips.map((payslip, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div>
                          <h4 className="font-medium">{payslip.month}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Paid on {payslip.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Gross</p>
                          <p className="font-medium text-xs sm:text-base">{payslip.gross}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Net</p>
                          <p className="font-bold text-green-600 text-xs sm:text-base">{payslip.net}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => toast.info('PDF download coming soon!')}>
                          <Download className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Attendance ────────────────────────────────────────────────────── */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
                {attendanceLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : attendanceHistory.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No attendance records found.</p>
                ) : (
                  attendanceHistory.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Clock3 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{record.date}</p>
                          <p className="text-sm text-gray-500">
                            {record.clockIn} - {record.clockOut}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium text-sm sm:text-base">{record.hours > 0 ? `${record.hours} hrs` : '-'}</p>
                        <Badge variant={
                          record.status === 'Present' ? 'default' : 
                          record.status === 'Leave' ? 'outline' : 'secondary'
                        }>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documents ─────────────────────────────────────────────────────── */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Documents</CardTitle>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <FileText className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-gray-500">
                          {doc.type} • {doc.size} • Uploaded {doc.uploadDate}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings ──────────────────────────────────────────────────────── */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Email alerts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive sign-in, leave, and payslip updates by email.</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting('emailAlerts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Leave status updates</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when HR approves or rejects a leave request.</p>
                  </div>
                  <Switch
                    checked={notificationSettings.leaveUpdates}
                    onCheckedChange={(checked) => updateNotificationSetting('leaveUpdates', checked)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">Weekly summary</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive a summary of attendance, documents, and leave balance.</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklySummary}
                    onCheckedChange={(checked) => updateNotificationSetting('weeklySummary', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => handleTabChange('personal')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Review personal details
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleTabChange('my-training')}>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  View my training programs
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleTabChange('attendance')}>
                  <Clock className="w-4 h-4 mr-2" />
                  Open attendance history
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleTabChange('documents')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Manage documents
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
                  Your notification settings are saved locally for this account so the header actions now open a working settings view.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
