import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Check, X, Clock, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

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

      // Get first employee as current user
      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .limit(1)
        .single();

      if (emp) {
        setCurrentEmployeeId(emp.id);
        await fetchLeaveBalance(emp.id);
      }

      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error initializing leave management', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('id', { ascending: false });

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
    await fetchLeaveRequests();
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
    await fetchLeaveRequests();
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
    await fetchLeaveRequests();
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 mt-1">Track and manage employee leave requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Submit your leave request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Leave Type</Label>
                <Select value={newLeave.type} onValueChange={(val) => setNewLeave({ ...newLeave, type: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                    <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="Explain the reason for your leave..."
                  rows={4}
                />
              </div>
            </div>
            <Button onClick={handleSubmitLeave} className="mt-4">Submit Request</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Annual Leave</h3>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-medium">{leaveBalance.annual.total} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Used</span>
                <span className="font-medium">{leaveBalance.annual.used} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remaining</span>
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
      </div>

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
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
