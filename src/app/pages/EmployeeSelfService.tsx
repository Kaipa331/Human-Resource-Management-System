import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { User, Mail, Phone, MapPin, Building, Calendar, Download, Edit, Clock, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function EmployeeSelfService() {
  const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');

  const profileData = {
    employeeId: 'EMP001',
    name: user.name || 'Precious Kaipa',
    email: 'precious.kaipa@company.com',
    phone: '+265 991 234 567',
    department: user.department || 'IT',
    position: 'Software Engineer',
    joinDate: '2024-01-15',
    reportingTo: 'Sarah Williams (HR Manager)',
    location: 'Lilongwe Office',
    address: '123 City Center, Area 47, Lilongwe',
    emergencyContact: 'Precious Kaipa - +265 991 987 654'
  };

  const leaveBalance = {
    annual: { total: 21, used: 8, remaining: 13 },
    sick: { total: 10, used: 2, remaining: 8 },
    emergency: { total: 3, used: 0, remaining: 3 },
  };

  const recentPayslips = [
    { month: 'March 2026', gross: 'MWK 1,000,000', net: 'MWK 800,000', date: '2026-03-31' },
    { month: 'February 2026', gross: 'MWK 1,000,000', net: 'MWK 800,000', date: '2026-02-28' },
    { month: 'January 2026', gross: 'MWK 1,000,000', net: 'MWK 800,000', date: '2026-01-31' },
  ];

  const attendanceHistory = [
    { date: '2026-03-14', clockIn: '08:00 AM', clockOut: '05:00 PM', hours: 9, status: 'Present' },
    { date: '2026-03-13', clockIn: '08:15 AM', clockOut: '05:10 PM', hours: 8.9, status: 'Present' },
    { date: '2026-03-12', clockIn: '08:30 AM', clockOut: '05:00 PM', hours: 8.5, status: 'Late' },
    { date: '2026-03-11', clockIn: '08:00 AM', clockOut: '05:05 PM', hours: 9, status: 'Present' },
    { date: '2026-03-10', clockIn: '-', clockOut: '-', hours: 0, status: 'Leave' },
  ];

  const myDocuments = [
    { name: 'Employment Contract', type: 'PDF', uploadDate: '2024-01-15', size: '245 KB' },
    { name: 'Tax Certificate 2025', type: 'PDF', uploadDate: '2026-01-05', size: '128 KB' },
    { name: 'Performance Review Q4 2025', type: 'PDF', uploadDate: '2026-01-20', size: '312 KB' },
    { name: 'ID Copy', type: 'PDF', uploadDate: '2024-01-15', size: '156 KB' },
  ];

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
        <h1 className="text-3xl font-bold text-gray-900">Employee Self-Service Portal</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and requests</p>
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
                  <p className="text-gray-500">{profileData.position}</p>
                  <Badge className="mt-2">{profileData.employeeId}</Badge>
                </div>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
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

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="leave">Leave Balance</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-lg">{profileData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee ID</label>
                  <p className="mt-1 text-lg">{profileData.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-lg">{profileData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-lg">{profileData.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="mt-1 text-lg">{profileData.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="mt-1 text-lg">{profileData.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Join Date</label>
                  <p className="mt-1 text-lg">{profileData.joinDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reporting To</label>
                  <p className="mt-1 text-lg">{profileData.reportingTo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Office Location</label>
                  <p className="mt-1 text-lg">{profileData.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-lg">{profileData.address}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                  <p className="mt-1 text-lg">{profileData.emergencyContact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Annual Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="font-medium">{leaveBalance.annual.total} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Used</span>
                    <span className="font-medium">{leaveBalance.annual.used} days</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">Remaining</span>
                    <span className="text-2xl font-bold text-blue-600">{leaveBalance.annual.remaining}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sick Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="font-medium">{leaveBalance.sick.total} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Used</span>
                    <span className="font-medium">{leaveBalance.sick.used} days</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">Remaining</span>
                    <span className="text-2xl font-bold text-green-600">{leaveBalance.sick.remaining}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Emergency Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="font-medium">{leaveBalance.emergency.total} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Used</span>
                    <span className="font-medium">{leaveBalance.emergency.used} days</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">Remaining</span>
                    <span className="text-2xl font-bold text-orange-600">{leaveBalance.emergency.remaining}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payslips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayslips.map((payslip, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{payslip.month}</h4>
                        <p className="text-sm text-gray-500">Paid on {payslip.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Gross</p>
                        <p className="font-medium">{payslip.gross}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Net</p>
                        <p className="font-bold text-green-600">{payslip.net}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceHistory.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{record.date}</p>
                        <p className="text-sm text-gray-500">
                          {record.clockIn} - {record.clockOut}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{record.hours > 0 ? `${record.hours} hrs` : '-'}</p>
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
        </TabsContent>

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
                        <FileText className="w-6 h-6 text-gray-600" />
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
      </Tabs>
    </div>
  );
}
