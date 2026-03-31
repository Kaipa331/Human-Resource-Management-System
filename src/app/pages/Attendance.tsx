import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Clock, Calendar as CalendarIcon, MapPin, CheckCircle, XCircle, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

const OFFICE_GEOFENCE = {
  label: 'Lilongwe Office',
  latitude: -13.9626,
  longitude: 33.7741,
  radiusKm: 0.7,
};

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  location: string | null;
  verification_status?: string | null;
  correction_reason?: string | null;
}

interface TeamMember {
  id: string;
  employee_id: string;
  name: string;
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  location: string | null;
}

interface ReviewItem {
  id: string;
  employeeName: string;
  employeeCode: string;
  date: string;
  status: string;
  clock_in: string | null;
  location: string | null;
  reason: string;
}

interface VerificationDetails {
  locationLabel: string;
  latitude: number | null;
  longitude: number | null;
  ipAddress: string | null;
  deviceInfo: string;
  withinGeofence: boolean;
  distanceKm: number | null;
  needsReview: boolean;
  summary: string;
}

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('hrms_user') || '{}');
  } catch {
    return {};
  }
};

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getPublicIp = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) return null;
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
};

const collectVerificationDetails = async (): Promise<VerificationDetails> => {
  const deviceInfo = typeof navigator !== 'undefined'
    ? `${navigator.platform || 'Unknown device'} • ${navigator.userAgent}`
    : 'Unknown device';

  const ipAddress = await getPublicIp();

  if (!('geolocation' in navigator)) {
    return {
      locationLabel: 'GPS unavailable on this device',
      latitude: null,
      longitude: null,
      ipAddress,
      deviceInfo,
      withinGeofence: false,
      distanceKm: null,
      needsReview: true,
      summary: `GPS unavailable • ${ipAddress ? `IP ${ipAddress}` : 'IP unavailable'} • ${deviceInfo}`,
    };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const distanceKm = calculateDistanceKm(latitude, longitude, OFFICE_GEOFENCE.latitude, OFFICE_GEOFENCE.longitude);
    const withinGeofence = distanceKm <= OFFICE_GEOFENCE.radiusKm;
    const locationLabel = withinGeofence
      ? `${OFFICE_GEOFENCE.label} • GPS verified`
      : `Outside ${OFFICE_GEOFENCE.label} geofence (${distanceKm.toFixed(2)} km away)`;

    return {
      locationLabel,
      latitude,
      longitude,
      ipAddress,
      deviceInfo,
      withinGeofence,
      distanceKm,
      needsReview: !withinGeofence,
      summary: `${locationLabel} • ${ipAddress ? `IP ${ipAddress}` : 'IP unavailable'} • ${deviceInfo}`,
    };
  } catch {
    return {
      locationLabel: 'Location permission not granted',
      latitude: null,
      longitude: null,
      ipAddress,
      deviceInfo,
      withinGeofence: false,
      distanceKm: null,
      needsReview: true,
      summary: `Location permission not granted • ${ipAddress ? `IP ${ipAddress}` : 'IP unavailable'} • ${deviceInfo}`,
    };
  }
};

const syncAttendanceToSurge = async (payload: Record<string, unknown>) => {
  const functionBaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '.functions.supabase.co');
  if (!functionBaseUrl) return;

  try {
    await fetch(`${functionBaseUrl}/server/make-server-37466ab9/integrations/surge/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Surge sync skipped:', error);
  }
};

export function Attendance() {
  const user = getStoredUser();
  const canReviewTeamAttendance = ['HR', 'Admin', 'Manager'].includes(user?.role);
  const showSelfClock = !canReviewTeamAttendance;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'clock-in' | 'clock-out' | 'correction' | 'review' | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<TeamMember[]>([]);
  const [pendingReviews, setPendingReviews] = useState<ReviewItem[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<{ id: string; employee_id: string; name: string } | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [verificationPreview, setVerificationPreview] = useState('GPS, IP and device checks will run when the employee clocks in/out.');

  const [monthlyStats, setMonthlyStats] = useState({
    totalDays: 0,
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    avgHours: 0,
  });

  const clockedIn = useMemo(
    () => Boolean(todayRecord?.clock_in && !todayRecord?.clock_out),
    [todayRecord],
  );

  const teamSummary = useMemo(() => ({
    present: teamAttendance.filter((member) => member.status === 'Present').length,
    late: teamAttendance.filter((member) => member.status === 'Late').length,
    review: teamAttendance.filter((member) => ['Needs Review', 'Correction Pending'].includes(member.status)).length,
    absent: teamAttendance.filter((member) => member.status === 'Absent').length,
  }), [teamAttendance]);

  useEffect(() => {
    initializeAttendance();
  }, []);

  const initializeAttendance = async () => {
    try {
      setLoading(true);

      let employeeRecord: { id: string; employee_id: string; name: string } | null = null;
      if (user?.email) {
        const { data } = await supabase
          .from('employees')
          .select('id, employee_id, name')
          .eq('email', String(user.email).toLowerCase())
          .maybeSingle();

        employeeRecord = data || null;
        setCurrentEmployee(employeeRecord);
      }

      const tasks: Promise<void>[] = [];
      if (employeeRecord?.id) {
        tasks.push(fetchAttendanceData(employeeRecord.id));
      } else {
        setAttendanceRecords([]);
        setTodayRecord(null);
      }

      if (canReviewTeamAttendance) {
        tasks.push(fetchTeamAttendance(), fetchPendingReviews());
      }

      await Promise.all(tasks);
    } catch (error) {
      console.error('Error initializing attendance', error);
      toast.error('Unable to load attendance data right now.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const { data: records } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', { ascending: false })
      .limit(10);

    setAttendanceRecords((records || []) as AttendanceRecord[]);

    const todayRec = (records || []).find((record) => record.date === today) as AttendanceRecord | undefined;
    setTodayRecord(todayRec || null);

    const monthStart = new Date();
    monthStart.setDate(1);

    const { data: monthRecords } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', today);

    if (monthRecords) {
      const present = monthRecords.filter((record) => ['Present', 'Needs Review'].includes(record.status)).length;
      const late = monthRecords.filter((record) => record.status === 'Late').length;
      const leave = monthRecords.filter((record) => record.status === 'Leave').length;
      const pending = monthRecords.filter((record) => record.status === 'Correction Pending').length;
      const workDaysSoFar = new Date().getDate();
      const absent = workDaysSoFar - present - late - leave - pending;

      let totalHours = 0;
      let hoursCount = 0;
      monthRecords.forEach((record) => {
        if (record.clock_in && record.clock_out) {
          const diff = new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime();
          totalHours += diff / (1000 * 60 * 60);
          hoursCount += 1;
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
  };

  const fetchTeamAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [{ data: todayAttendance }, { data: allEmployees }] = await Promise.all([
      supabase.from('attendance').select('*').eq('date', today),
      supabase.from('employees').select('id, employee_id, name'),
    ]);

    if (!allEmployees) {
      setTeamAttendance([]);
      return;
    }

    const team: TeamMember[] = allEmployees.map((employee) => {
      const attendance = todayAttendance?.find((record) => record.employee_id === employee.id);
      return {
        id: employee.id,
        employee_id: employee.employee_id,
        name: employee.name,
        status: attendance?.status || 'Absent',
        clock_in: attendance?.clock_in || null,
        clock_out: attendance?.clock_out || null,
        location: attendance?.location || 'No punch recorded',
      };
    });

    setTeamAttendance(team);
  };

  const fetchPendingReviews = async () => {
    const reviewStartDate = new Date();
    reviewStartDate.setDate(reviewStartDate.getDate() - 14);

    const [{ data: reviewRows }, { data: allEmployees }] = await Promise.all([
      supabase
        .from('attendance')
        .select('*')
        .gte('date', reviewStartDate.toISOString().split('T')[0])
        .order('date', { ascending: false }),
      supabase.from('employees').select('id, employee_id, name'),
    ]);

    if (!reviewRows || !allEmployees) {
      setPendingReviews([]);
      return;
    }

    const employeeMap = new Map(allEmployees.map((employee) => [employee.id, employee]));
    const flaggedRows = reviewRows.filter((record) => {
      const locationText = String(record.location || '').toLowerCase();
      return ['Needs Review', 'Correction Pending'].includes(record.status)
        || locationText.includes('manual correction')
        || locationText.includes('outside')
        || locationText.includes('permission not granted');
    });

    setPendingReviews(flaggedRows.map((record) => ({
      id: record.id,
      employeeName: employeeMap.get(record.employee_id)?.name || 'Unknown employee',
      employeeCode: employeeMap.get(record.employee_id)?.employee_id || '-',
      date: record.date,
      status: record.status,
      clock_in: record.clock_in,
      location: record.location || null,
      reason: record.correction_reason || record.location || 'Awaiting manager review',
    })));
  };

  const handleClockIn = async () => {
    if (!currentEmployee?.id) {
      toast.error('Your account is not linked to an employee profile yet.');
      return;
    }

    setActionLoading('clock-in');

    try {
      const verification = await collectVerificationDetails();
      setVerificationPreview(verification.summary);

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const isLate = now.getHours() >= 9;
      const fallbackStatus = verification.needsReview ? 'Needs Review' : isLate ? 'Late' : 'Present';

      let record: AttendanceRecord | null = null;

      const { data: rpcData, error: rpcError } = await supabase.rpc('clock_in_attendance', {
        p_employee_id: currentEmployee.id,
        p_latitude: verification.latitude,
        p_longitude: verification.longitude,
        p_location_label: verification.summary,
        p_ip_address: verification.ipAddress,
        p_device_info: verification.deviceInfo,
        p_within_geofence: verification.withinGeofence,
      });

      if (!rpcError) {
        record = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as AttendanceRecord | null;
      }

      if (!record) {
        const { data, error } = await supabase
          .from('attendance')
          .insert([{
            employee_id: currentEmployee.id,
            date: today,
            clock_in: now.toISOString(),
            status: fallbackStatus,
            location: verification.summary,
          }])
          .select()
          .single();

        if (error) throw error;
        record = data as AttendanceRecord;
      }

      setTodayRecord(record);
      toast.success(
        verification.needsReview
          ? 'Clock-in recorded and sent for manager review.'
          : `Clocked in successfully at ${formatTime(record.clock_in)}.`,
      );

      await Promise.all([
        fetchAttendanceData(currentEmployee.id),
        canReviewTeamAttendance ? fetchTeamAttendance() : Promise.resolve(),
        canReviewTeamAttendance ? fetchPendingReviews() : Promise.resolve(),
      ]);

      await syncAttendanceToSurge({
        event: 'attendance.clock_in',
        employeeId: currentEmployee.id,
        employeeCode: currentEmployee.employee_id,
        employeeName: currentEmployee.name,
        status: record.status,
        verification,
      });
    } catch (error: any) {
      toast.error('Error clocking in: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;

    setActionLoading('clock-out');

    try {
      const verification = await collectVerificationDetails();
      setVerificationPreview(verification.summary);

      let updatedRecord: AttendanceRecord | null = null;

      const { data: rpcData, error: rpcError } = await supabase.rpc('clock_out_attendance', {
        p_attendance_id: todayRecord.id,
        p_latitude: verification.latitude,
        p_longitude: verification.longitude,
        p_location_label: verification.summary,
        p_ip_address: verification.ipAddress,
        p_device_info: verification.deviceInfo,
        p_within_geofence: verification.withinGeofence,
      });

      if (!rpcError) {
        updatedRecord = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as AttendanceRecord | null;
      }

      if (!updatedRecord) {
        const now = new Date();
        const nextStatus = verification.needsReview && todayRecord.status !== 'Correction Pending'
          ? 'Needs Review'
          : todayRecord.status;

        const { data, error } = await supabase
          .from('attendance')
          .update({
            clock_out: now.toISOString(),
            status: nextStatus,
            location: verification.summary,
          })
          .eq('id', todayRecord.id)
          .select()
          .single();

        if (error) throw error;
        updatedRecord = data as AttendanceRecord;
      }

      setTodayRecord(updatedRecord);
      toast.success(
        verification.needsReview
          ? 'Clock-out recorded and flagged for review.'
          : `Clocked out at ${formatTime(updatedRecord.clock_out)}.`,
      );

      if (currentEmployee?.id) {
        await Promise.all([
          fetchAttendanceData(currentEmployee.id),
          canReviewTeamAttendance ? fetchTeamAttendance() : Promise.resolve(),
          canReviewTeamAttendance ? fetchPendingReviews() : Promise.resolve(),
        ]);
      }

      await syncAttendanceToSurge({
        event: 'attendance.clock_out',
        attendanceId: todayRecord.id,
        employeeId: currentEmployee?.id,
        employeeCode: currentEmployee?.employee_id,
        employeeName: currentEmployee?.name,
        status: updatedRecord.status,
        verification,
      });
    } catch (error: any) {
      toast.error('Error clocking out: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualCorrection = async () => {
    if (!currentEmployee?.id) {
      toast.error('Your account is not linked to an employee profile yet.');
      return;
    }

    if (!correctionReason.trim()) {
      toast.error('Please explain why the manual correction is needed.');
      return;
    }

    setActionLoading('correction');

    try {
      const verification = await collectVerificationDetails();
      const today = new Date().toISOString().split('T')[0];
      const reviewNote = `${verification.summary} • Manual correction requested: ${correctionReason.trim()}`;

      if (todayRecord) {
        const { error } = await supabase
          .from('attendance')
          .update({
            status: 'Correction Pending',
            location: reviewNote,
          })
          .eq('id', todayRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert([{
            employee_id: currentEmployee.id,
            date: today,
            status: 'Correction Pending',
            location: reviewNote,
          }]);

        if (error) throw error;
      }

      setCorrectionReason('');
      setCorrectionOpen(false);
      toast.success('Manual correction request submitted for manager approval.');

      await Promise.all([
        fetchAttendanceData(currentEmployee.id),
        canReviewTeamAttendance ? fetchTeamAttendance() : Promise.resolve(),
        canReviewTeamAttendance ? fetchPendingReviews() : Promise.resolve(),
      ]);

      await syncAttendanceToSurge({
        event: 'attendance.manual_correction_requested',
        employeeId: currentEmployee.id,
        employeeCode: currentEmployee.employee_id,
        employeeName: currentEmployee.name,
        reason: correctionReason.trim(),
        verification,
      });
    } catch (error: any) {
      toast.error('Error requesting manual correction: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewDecision = async (review: ReviewItem, decision: 'approve' | 'reject') => {
    setActionLoading('review');

    try {
      const approver = user?.name || user?.email || 'Manager';
      const approvedStatus = decision === 'approve'
        ? (review.clock_in && new Date(review.clock_in).getHours() >= 9 ? 'Late' : 'Present')
        : 'Rejected';

      const { error: rpcError } = await supabase.rpc('approve_attendance_exception', {
        p_attendance_id: review.id,
        p_approved_by: approver,
        p_approved_status: approvedStatus,
      });

      if (rpcError) {
        const reviewNote = `${review.location || OFFICE_GEOFENCE.label} • ${decision === 'approve' ? 'Approved' : 'Rejected'} by ${approver}`;
        const { error } = await supabase
          .from('attendance')
          .update({
            status: approvedStatus,
            location: reviewNote,
          })
          .eq('id', review.id);

        if (error) throw error;
      }

      toast.success(`Attendance record ${decision === 'approve' ? 'approved' : 'rejected'}.`);

      await Promise.all([
        fetchPendingReviews(),
        fetchTeamAttendance(),
        currentEmployee?.id ? fetchAttendanceData(currentEmployee.id) : Promise.resolve(),
      ]);

      await syncAttendanceToSurge({
        event: `attendance.${decision}`,
        attendanceId: review.id,
        employeeCode: review.employeeCode,
        employeeName: review.employeeName,
        reviewedBy: approver,
        status: approvedStatus,
      });
    } catch (error: any) {
      toast.error('Error reviewing attendance: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Late': return 'bg-yellow-100 text-yellow-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'Leave': return 'bg-blue-100 text-blue-800';
      case 'Needs Review': return 'bg-amber-100 text-amber-800';
      case 'Correction Pending': return 'bg-orange-100 text-orange-800';
      case 'Rejected': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return '-';
    return `${((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / (1000 * 60 * 60)).toFixed(1)} hrs`;
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
        <p className="text-gray-500 mt-1">
          {showSelfClock
            ? 'Employees clock themselves in/out while the system verifies location and device details.'
            : 'Review team punches, confirm exceptions and approve manual corrections.'}
        </p>
      </div>

      <div className={`rounded-xl border p-4 ${showSelfClock ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {showSelfClock ? (
            <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          )}
          <div>
            <p className="font-medium text-gray-900">
              {showSelfClock ? 'Verified self clock-in is enabled' : 'Manager review mode is enabled'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {showSelfClock
                ? 'Each punch is tied to the signed-in employee, checks GPS/IP/device details, and flags anything outside the office geofence for review.'
                : 'Employees clock themselves in/out. Use the review queue below to approve exceptions and manual attendance corrections.'}
            </p>
          </div>
        </div>
      </div>

      {showSelfClock ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              {!currentEmployee ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Your login is not linked to an employee record yet. Please ask HR to complete the profile mapping.
                </div>
              ) : !todayRecord ? (
                <Button onClick={handleClockIn} className="w-full" size="lg" disabled={actionLoading !== null}>
                  {actionLoading === 'clock-in' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                  Clock In
                </Button>
              ) : clockedIn ? (
                <Button onClick={handleClockOut} variant="destructive" className="w-full" size="lg" disabled={actionLoading !== null}>
                  {actionLoading === 'clock-out' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />}
                  Clock Out
                </Button>
              ) : (
                <div className="text-center text-sm text-gray-500 py-2">
                  You've completed your shift for today ✓
                </div>
              )}

              <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={!currentEmployee || actionLoading !== null}>
                    Request Manual Correction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Manual Attendance Correction</DialogTitle>
                    <DialogDescription>
                      Use this if you missed a punch or your GPS verification could not be confirmed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label htmlFor="correction-reason">Reason</Label>
                      <Textarea
                        id="correction-reason"
                        value={correctionReason}
                        onChange={(event) => setCorrectionReason(event.target.value)}
                        placeholder="Example: My browser blocked location access when I arrived at the office."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleManualCorrection} className="w-full" disabled={actionLoading !== null}>
                      {actionLoading === 'correction' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Submit for Approval
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{todayRecord?.location || verificationPreview}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Office geofence: {OFFICE_GEOFENCE.label} within {OFFICE_GEOFENCE.radiusKm} km
                </p>
              </div>
            </CardContent>
          </Card>

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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Oversight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-3xl font-bold text-green-600">{teamSummary.present}</p>
                <p className="text-xs text-gray-500">employees</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-3xl font-bold text-yellow-600">{teamSummary.late}</p>
                <p className="text-xs text-gray-500">employees</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Needs Review</p>
                <p className="text-3xl font-bold text-amber-600">{teamSummary.review}</p>
                <p className="text-xs text-gray-500">exceptions</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-red-600">{teamSummary.absent}</p>
                <p className="text-xs text-gray-500">employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentEmployee?.id && (
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
                      {record.location && (
                        <p className="text-xs text-gray-500 mt-1">{record.location}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{calculateHours(record.clock_in, record.clock_out)}</p>
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
      )}

      {canReviewTeamAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Attendance Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingReviews.length > 0 ? pendingReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{review.employeeName}</p>
                        <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{review.employeeCode} • {review.date}</p>
                      <p className="text-sm text-gray-600 mt-2">{review.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">Clock in: {formatTime(review.clock_in)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewDecision(review, 'approve')}
                        className="text-green-600 hover:text-green-700"
                        disabled={actionLoading === 'review'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewDecision(review, 'reject')}
                        className="text-red-600 hover:text-red-700"
                        disabled={actionLoading === 'review'}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400 text-center py-4">All current clock-ins are verified or already reviewed.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canReviewTeamAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Team Attendance Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamAttendance.length > 0 ? teamAttendance.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    <div className="text-right max-w-xs">
                      <p className="text-sm font-medium">{formatTime(member.clock_in)}</p>
                      <p className="text-xs text-gray-500 truncate">{member.location}</p>
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
      )}
    </div>
  );
}
