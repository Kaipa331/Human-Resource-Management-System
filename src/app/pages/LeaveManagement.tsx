import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Check, X, Clock, Loader2, FileText, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { FormField, FormSection, FormActions } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import Loader from '../components/ui/Loader';

interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
}

export function LeaveManagement() {
  const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');
  const canApprove = user?.role === 'HR' || user?.role === 'Admin' || user?.role === 'Manager';
  const userEmail = String(user?.email || '').toLowerCase();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const [newLeave, setNewLeave] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Leave balance computed from data
  const [leaveBalance, setLeaveBalance] = useState({
    annual: { total: 21, used: 0, remaining: 21 },
    sick: { total: 10, used: 0, remaining: 10 },
    emergency: { total: 3, used: 0, remaining: 3 },
  });

  useEffect(() => {
    initializeLeave();
  }, []);

  const initializeLeave = async () => {
    try {
      setLoading(true);

      let resolvedEmployeeId: string | null = null;

      if (userEmail) {
        const { data: emp } = await supabase
          .from('employees')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        resolvedEmployeeId = emp?.id || null;
        setCurrentEmployeeId(resolvedEmployeeId);
      }

      if (!canApprove && resolvedEmployeeId) {
        await fetchLeaveBalance(resolvedEmployeeId);
      }

      await fetchLeaveRequests(resolvedEmployeeId);
    } catch (error) {
      console.error('Error initializing leave management', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async (employeeId?: string | null) => {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .order('start_date', { ascending: false });

    if (!canApprove) {
      if (!employeeId) {
        setLeaveRequests([]);
        return;
      }
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Error fetching leave requests');
      return;
    }

    // Enrich with employee names
    const enriched: LeaveRequest[] = await Promise.all(
      (data || []).map(async (req) => {
        const { data: emp } = await supabase
          .from('employees')
          .select('name')
          .eq('id', req.employee_id)
          .single();

        const start = new Date(req.start_date);
        const end = new Date(req.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return {
          id: req.id,
          employee_id: req.employee_id,
          employee_name: emp?.name || 'Unknown',
          type: req.type,
          start_date: req.start_date,
          end_date: req.end_date,
          days,
          reason: req.reason || '',
          status: req.status,
        };
      })
    );

    setLeaveRequests(enriched);
  };

  const fetchLeaveBalance = async (employeeId: string) => {
    const { data: approvedLeaves } = await supabase
      .from('leave_requests')
      .select('type, start_date, end_date')
      .eq('employee_id', employeeId)
      .eq('status', 'Approved');

    let annualUsed = 0;
    let sickUsed = 0;
    let emergencyUsed = 0;

    (approvedLeaves || []).forEach((lv) => {
      const days = Math.ceil(
        (new Date(lv.end_date).getTime() - new Date(lv.start_date).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

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

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'Approved' })
      .eq('id', id);

    if (error) {
      toast.error('Error approving leave');
      return;
    }
    toast.success('Leave request approved');
    await fetchLeaveRequests(currentEmployeeId);
    if (currentEmployeeId) await fetchLeaveBalance(currentEmployeeId);
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'Rejected' })
      .eq('id', id);

    if (error) {
      toast.error('Error rejecting leave');
      return;
    }
    toast.success('Leave request rejected');
    await fetchLeaveRequests(currentEmployeeId);
  };

  const handleSubmitLeave = async () => {
    if (!newLeave.type || !newLeave.startDate || !newLeave.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!currentEmployeeId) {
      toast.error('No employee found. Please add employees first.');
      return;
    }

    const { error } = await supabase
      .from('leave_requests')
      .insert([{
        employee_id: currentEmployeeId,
        type: newLeave.type,
        start_date: newLeave.startDate,
        end_date: newLeave.endDate,
        reason: newLeave.reason,
        status: 'Pending',
      }]);

    if (error) {
      toast.error('Error submitting leave: ' + error.message);
      return;
    }

    toast.success('Leave request submitted');
    setNewLeave({ type: '', startDate: '', endDate: '', reason: '' });
    setDialogOpen(false);
    await fetchLeaveRequests(currentEmployeeId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading leave management..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage employee leave requests</p>
        </div>
        {!canApprove && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                Apply for Leave
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Apply for Leave</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 font-medium">Request time off for rest, health, or personal needs</DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
              <FormSection
                title="Leave Details"
                description="Type and duration of your request"
                icon={<Info className="w-4 h-4 text-blue-600" />}
                accentColor="border-blue-500"
              >
                <div className="md:col-span-2">
                  <FormField label="Leave Type" required hint="Select the category that best fits your needs">
                    <Select value={newLeave.type} onValueChange={(val) => setNewLeave({ ...newLeave, type: val })}>
                      <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Annual Leave">Annual Leave (Vacation)</SelectItem>
                        <SelectItem value="Sick Leave">Sick Leave (Medical)</SelectItem>
                        <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                        <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                        <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                        <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                <FormField label="Start Date" required>
                  <input
                    type="date"
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="End Date" required>
                  <input
                    type="date"
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </FormField>
              </FormSection>

              <FormSection
                title="Additional Context"
                description="Optional details for your manager"
                icon={<FileText className="w-4 h-4 text-purple-600" />}
                accentColor="border-purple-500"
              >
                <div className="md:col-span-2">
                  <FormField label="Reason for Leave" hint="Provide a brief explanation if necessary">
                    <Textarea
                      value={newLeave.reason}
                      onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                      placeholder="e.g. Attending a family event, Medical appointment, etc."
                      rows={4}
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none resize-none"
                    />
                  </FormField>
                </div>
              </FormSection>
            </div>

            <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <FormActions
                onCancel={() => setDialogOpen(false)}
                onSubmit={handleSubmitLeave}
                submitLabel="Submit Leave Request"
              />
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Leave Balance - Only for Employees */}
      {!canApprove && (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Annual Leave</h3>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total</span>
                  <span className="font-medium">{leaveBalance.annual.total} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Used</span>
                  <span className="font-medium">{leaveBalance.annual.used} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Remaining</span>
                  <span className="font-bold text-blue-600">{leaveBalance.annual.remaining} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(leaveBalance.annual.used / leaveBalance.annual.total) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sick Leave</h3>
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-medium">{leaveBalance.sick.total} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Used</span>
                <span className="font-medium">{leaveBalance.sick.used} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remaining</span>
                <span className="font-bold text-green-600">{leaveBalance.sick.remaining} days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(leaveBalance.sick.used / leaveBalance.sick.total) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Emergency Leave</h3>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-medium">{leaveBalance.emergency.total} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Used</span>
                <span className="font-medium">{leaveBalance.emergency.used} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remaining</span>
                <span className="font-bold text-orange-600">{leaveBalance.emergency.remaining} days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: `${(leaveBalance.emergency.used / leaveBalance.emergency.total) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>{canApprove ? 'Team Leave Requests' : 'My Leave Requests'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveRequests.length > 0 ? leaveRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{request.employee_name}</h3>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <strong>Type:</strong> {request.type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Period:</strong> {request.start_date} to {request.end_date} ({request.days} days)
                      </p>
                      {request.reason && (
                        <p className="text-sm text-gray-600">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  {canApprove && request.status === 'Pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(request.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-gray-400 text-center py-4">No leave requests found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
