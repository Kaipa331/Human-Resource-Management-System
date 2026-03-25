import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Clock, Calendar as CalendarIcon, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { toast } from 'sonner';

export function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);

  const attendanceRecords = [
    { date: '2026-03-14', clockIn: '08:00 AM', clockOut: '05:00 PM', status: 'Present', hours: 9 },
    { date: '2026-03-13', clockIn: '08:15 AM', clockOut: '05:10 PM', status: 'Present', hours: 8.9 },
    { date: '2026-03-12', clockIn: '08:30 AM', clockOut: '05:00 PM', status: 'Late', hours: 8.5 },
    { date: '2026-03-11', clockIn: '08:00 AM', clockOut: '05:05 PM', status: 'Present', hours: 9 },
    { date: '2026-03-10', clockIn: '-', clockOut: '-', status: 'Leave', hours: 0 },
  ];

  const teamAttendance = [
    { id: 'EMP001', name: 'John Doe', status: 'Present', clockIn: '08:00 AM', location: 'Office' },
    { id: 'EMP002', name: 'Sarah Williams', status: 'Present', clockIn: '08:15 AM', location: 'Office' },
    { id: 'EMP003', name: 'Michael Brown', status: 'Leave', clockIn: '-', location: '-' },
    { id: 'EMP004', name: 'Emily Davis', status: 'Present', clockIn: '08:30 AM', location: 'Remote' },
    { id: 'EMP005', name: 'James Wilson', status: 'Late', clockIn: '09:15 AM', location: 'Office' },
  ];

  const monthlyStats = {
    totalDays: 20,
    present: 17,
    late: 2,
    absent: 0,
    leave: 1,
    avgHours: 8.8
  };

  const handleClockIn = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setClockInTime(time);
    setClockedIn(true);
    toast.success(`Clocked in at ${time}`);
  };

  const handleClockOut = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setClockOutTime(time);
    setClockedIn(false);
    toast.success(`Clocked out at ${time}`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Late': return 'bg-yellow-100 text-yellow-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'Leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
        <p className="text-gray-500 mt-1">Monitor and manage employee attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock In/Out */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Time Clock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-6">
              <Clock className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <div className="text-4xl font-bold mb-2">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {clockInTime && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  <strong>Clock In:</strong> {clockInTime}
                </p>
              </div>
            )}

            {clockOutTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Clock Out:</strong> {clockOutTime}
                </p>
              </div>
            )}

            {!clockedIn ? (
              <Button onClick={handleClockIn} className="w-full" size="lg">
                <CheckCircle className="w-5 h-5 mr-2" />
                Clock In
              </Button>
            ) : (
              <Button onClick={handleClockOut} variant="destructive" className="w-full" size="lg">
                <XCircle className="w-5 h-5 mr-2" />
                Clock Out
              </Button>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Location: Office - Lilongwe</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-3xl font-bold text-green-600">{monthlyStats.present}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-3xl font-bold text-yellow-600">{monthlyStats.late}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-red-600">{monthlyStats.absent}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Leave</p>
                <p className="text-3xl font-bold text-blue-600">{monthlyStats.leave}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Hours</p>
                <p className="text-3xl font-bold text-purple-600">{monthlyStats.avgHours}</p>
                <p className="text-xs text-gray-500">hours/day</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Attendance %</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {((monthlyStats.present / monthlyStats.totalDays) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">rate</p>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>My Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceRecords.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{record.date}</p>
                    <p className="text-sm text-gray-500">
                      {record.clockIn} - {record.clockOut}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{record.hours > 0 ? `${record.hours} hrs` : '-'}</p>
                  </div>
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Attendance (for managers) */}
      <Card>
        <CardHeader>
          <CardTitle>Team Attendance Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamAttendance.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{member.clockIn}</p>
                    <p className="text-xs text-gray-500">{member.location}</p>
                  </div>
                  <Badge className={getStatusColor(member.status)}>
                    {member.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
