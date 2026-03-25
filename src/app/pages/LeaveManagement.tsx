import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Check, X, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export function LeaveManagement() {
  const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');
  const canApprove = user?.role === 'HR' || user?.role === 'Admin' || user?.role === 'Manager';

  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 'LV001',
      employeeName: 'John Doe',
      employeeId: 'EMP001',
      type: 'Annual Leave',
      startDate: '2026-03-20',
      endDate: '2026-03-25',
      days: 5,
      reason: 'Family vacation',
      status: 'Pending',
      appliedDate: '2026-03-10'
    },
    {
      id: 'LV002',
      employeeName: 'Sarah Williams',
      employeeId: 'EMP002',
      type: 'Sick Leave',
      startDate: '2026-03-15',
      endDate: '2026-03-16',
      days: 2,
      reason: 'Medical appointment',
      status: 'Approved',
      appliedDate: '2026-03-12'
    },
    {
      id: 'LV003',
      employeeName: 'Michael Brown',
      employeeId: 'EMP003',
      type: 'Annual Leave',
      startDate: '2026-04-01',
      endDate: '2026-04-10',
      days: 9,
      reason: 'Personal travel',
      status: 'Pending',
      appliedDate: '2026-03-13'
    },
  ]);

  const [newLeave, setNewLeave] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const leaveBalance = {
    annual: { total: 21, used: 8, remaining: 13 },
    sick: { total: 10, used: 2, remaining: 8 },
    emergency: { total: 3, used: 0, remaining: 3 },
  };

  const handleApprove = (id: string) => {
    setLeaveRequests(leaveRequests.map(req => 
      req.id === id ? { ...req, status: 'Approved' } : req
    ));
    toast.success('Leave request approved');
  };

  const handleReject = (id: string) => {
    setLeaveRequests(leaveRequests.map(req => 
      req.id === id ? { ...req, status: 'Rejected' } : req
    ));
    toast.success('Leave request rejected');
  };

  const handleSubmitLeave = () => {
    if (!newLeave.type || !newLeave.startDate || !newLeave.endDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveId = `LV${String(leaveRequests.length + 1).padStart(3, '0')}`;
    setLeaveRequests([...leaveRequests, {
      id: leaveId,
      employeeName: user.name,
      employeeId: 'EMP001',
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      days,
      reason: newLeave.reason,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    }]);
    setNewLeave({ type: '', startDate: '', endDate: '', reason: '' });
    toast.success('Leave request submitted');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 mt-1">Track and manage employee leave requests</p>
        </div>
        <Dialog>
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
            {leaveRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{request.employeeName}</h3>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <strong>Type:</strong> {request.type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Period:</strong> {request.startDate} to {request.endDate} ({request.days} days)
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                      <p className="text-sm text-gray-500">
                        Applied on {request.appliedDate}
                      </p>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
