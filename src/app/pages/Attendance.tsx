import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Clock, Calendar as CalendarIcon, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  location: string | null;
}

interface TeamMember {
  employee_id: string;
  name: string;
  status: string;
  clock_in: string | null;
  location: string | null;
}

export function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [clockedIn, setClockedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<TeamMember[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const [monthlyStats, setMonthlyStats] = useState({
    totalDays: 0, present: 0, late: 0, absent: 0, leave: 0, avgHours: 0,
  });

  useEffect(() => {
    initializeAttendance();
  }, []);

  const initializeAttendance = async () => {
    try {
      setLoading(true);

      // Get the first employee as the "current user" (in production, link to auth user)
      const { data: employees } = await supabase
        .from('employees')
        .select('id, employee_id, name')
        .limit(1)
        .single();

      if (!employees) {
        setLoading(false);
        return;
      }

      setCurrentEmployeeId(employees.id);
      await fetchAttendanceData(employees.id);
    } catch (error) {
      console.error('Error initializing attendance', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch personal attendance history (last 10 records)
    const { data: records } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', { ascending: false })
      .limit(10);
    setAttendanceRecords(records || []);

    // Check today's record
    const todayRec = records?.find((r) => r.date === today);
    if (todayRec) {
      setTodayRecord(todayRec);
      setClockedIn(todayRec.clock_in !== null && todayRec.clock_out === null);
    }

    // Calculate monthly stats
    const monthStart = new Date();
    monthStart.setDate(1);
    const { data: monthRecords } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', today);

    if (monthRecords) {
      const present = monthRecords.filter((r) => r.status === 'Present').length;
      const late = monthRecords.filter((r) => r.status === 'Late').length;
      const leave = monthRecords.filter((r) => r.status === 'Leave').length;
      const workDaysSoFar = new Date().getDate();
      const absent = workDaysSoFar - present - late - leave;

      let totalHours = 0;
      let hoursCount = 0;
      monthRecords.forEach((r) => {
        if (r.clock_in && r.clock_out) {
          const diff = new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime();
          totalHours += diff / (1000 * 60 * 60);
          hoursCount++;
        }
      });

      setMonthlyStats({
        totalDays: workDaysSoFar,
        present,
        late,
        absent: Math.max(0, absent),
        leave,
        avgHours: hoursCount > 0 ? Math.round((totalHours / hoursCount) * 10) / 10 : 0,
      });
    }

    // Fetch team attendance today
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('employee_id, clock_in, status, location')
      .eq('date', today);

    const { data: allEmployees } = await supabase
      .from('employees')
      .select('id, employee_id, name');

    if (allEmployees) {
      const team: TeamMember[] = allEmployees.map((emp) => {
        const att = todayAttendance?.find((a) => a.employee_id === emp.id);
        return {
          employee_id: emp.employee_id,
          name: emp.name,
          status: att?.status || 'Absent',
          clock_in: att?.clock_in || null,
          location: att?.location || '-',
        };
      });
      setTeamAttendance(team);
    }
  };

  const handleClockIn = async () => {
    if (!currentEmployeeId) {
      toast.error('No employee found. Please add employees first.');
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const isLate = now.getHours() >= 9; // Consider 9 AM+ as late

    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          employee_id: currentEmployeeId,
          date: today,
          clock_in: now.toISOString(),
          status: isLate ? 'Late' : 'Present',
          location: 'Office',
        }])
        .select()
        .single();

      if (error) throw error;

      setTodayRecord(data);
      setClockedIn(true);
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      toast.success(`Clocked in at ${time}`);
      await fetchAttendanceData(currentEmployeeId);
    } catch (error: any) {
      toast.error('Error clocking in: ' + error.message);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;

    const now = new Date();

    try {
      const { error } = await supabase
        .from('attendance')
        .update({ clock_out: now.toISOString() })
        .eq('id', todayRecord.id);

      if (error) throw error;

      setClockedIn(false);
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      toast.success(`Clocked out at ${time}`);
      if (currentEmployeeId) await fetchAttendanceData(currentEmployeeId);
    } catch (error: any) {
      toast.error('Error clocking out: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Late': return 'bg-yellow-100 text-yellow-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'Leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

            {todayRecord?.clock_in && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  <strong>Clock In:</strong> {formatTime(todayRecord.clock_in)}
                </p>
              </div>
            )}

            {todayRecord?.clock_out && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Clock Out:</strong> {formatTime(todayRecord.clock_out)}
                </p>
              </div>
            )}

            {!todayRecord ? (
              <Button onClick={handleClockIn} className="w-full" size="lg">
                <CheckCircle className="w-5 h-5 mr-2" />
                Clock In
              </Button>
            ) : clockedIn ? (
              <Button onClick={handleClockOut} variant="destructive" className="w-full" size="lg">
                <XCircle className="w-5 h-5 mr-2" />
                Clock Out
              </Button>
            ) : (
              <div className="text-center text-sm text-gray-500 py-2">
                You've completed your shift for today ✓
              </div>
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
                  {monthlyStats.totalDays > 0
                    ? (((monthlyStats.present + monthlyStats.late) / monthlyStats.totalDays) * 100).toFixed(0)
                    : 0}%
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
            {attendanceRecords.length > 0 ? attendanceRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{record.date}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(record.clock_in)} - {formatTime(record.clock_out)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {record.clock_in && record.clock_out
                        ? `${((new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / (1000 * 60 * 60)).toFixed(1)} hrs`
                        : '-'}
                    </p>
                  </div>
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                </div>
              </div>
            )) : (
              <p className="text-gray-400 text-center py-4">No attendance records yet. Clock in to get started!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Attendance Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamAttendance.length > 0 ? teamAttendance.map((member) => (
              <div key={member.employee_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.employee_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(member.clock_in)}</p>
                    <p className="text-xs text-gray-500">{member.location}</p>
                  </div>
                  <Badge className={getStatusColor(member.status)}>
                    {member.status}
                  </Badge>
                </div>
              </div>
            )) : (
              <p className="text-gray-400 text-center py-4">No employees found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
