import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Briefcase, Users, Calendar, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export function Recruitment() {
  const [jobPostings, setJobPostings] = useState([
    { 
      id: 'JOB001', 
      title: 'Senior Software Engineer', 
      department: 'IT', 
      location: 'Lilongwe',
      type: 'Full-time',
      applicants: 24,
      status: 'Open',
      postedDate: '2026-03-01'
    },
    { 
      id: 'JOB002', 
      title: 'HR Assistant', 
      department: 'HR', 
      location: 'Blantyre',
      type: 'Full-time',
      applicants: 15,
      status: 'Open',
      postedDate: '2026-03-05'
    },
    { 
      id: 'JOB003', 
      title: 'Marketing Manager', 
      department: 'Marketing', 
      location: 'Lilongwe',
      type: 'Full-time',
      applicants: 32,
      status: 'In Progress',
      postedDate: '2026-02-20'
    },
  ]);

  const [applicants, setApplicants] = useState([
    {
      id: 'APP001',
      name: 'Alice Johnson',
      email: 'alice.j@email.com',
      phone: '+265 991 111 222',
      position: 'Senior Software Engineer',
      appliedDate: '2026-03-08',
      status: 'Under Review',
      experience: '5 years'
    },
    {
      id: 'APP002',
      name: 'Robert Smith',
      email: 'robert.s@email.com',
      phone: '+265 991 222 333',
      position: 'Senior Software Engineer',
      appliedDate: '2026-03-07',
      status: 'Interview Scheduled',
      experience: '7 years'
    },
    {
      id: 'APP003',
      name: 'Maria Garcia',
      email: 'maria.g@email.com',
      phone: '+265 991 333 444',
      position: 'HR Assistant',
      appliedDate: '2026-03-10',
      status: 'New',
      experience: '2 years'
    },
  ]);

  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: '',
    description: '',
  });

  const handleAddJob = () => {
    if (!newJob.title || !newJob.department) {
      toast.error('Please fill in required fields');
      return;
    }
    const jobId = `JOB${String(jobPostings.length + 1).padStart(3, '0')}`;
    setJobPostings([...jobPostings, {
      id: jobId,
      ...newJob,
      applicants: 0,
      status: 'Open',
      postedDate: new Date().toISOString().split('T')[0]
    }]);
    setNewJob({ title: '', department: '', location: '', type: '', description: '' });
    toast.success('Job posting created');
  };

  const updateApplicantStatus = (id: string, newStatus: string) => {
    setApplicants(applicants.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
    toast.success(`Applicant status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruitment & Hiring</h1>
          <p className="text-gray-500 mt-1">Manage job postings and applicant tracking</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Job Posting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Job Posting</DialogTitle>
              <DialogDescription>Post a new job opening</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Job Title *</Label>
                <Input
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department *</Label>
                  <Select value={newJob.department} onValueChange={(val) => setNewJob({ ...newJob, department: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="Lilongwe, Blantyre, etc."
                  />
                </div>
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select value={newJob.type} onValueChange={(val) => setNewJob({ ...newJob, type: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Job Description</Label>
                <Textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Enter job description, requirements, and responsibilities..."
                  rows={6}
                />
              </div>
            </div>
            <Button onClick={handleAddJob} className="mt-4">Post Job</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open Positions</p>
                <h3 className="text-2xl font-bold mt-1">{jobPostings.filter(j => j.status === 'Open').length}</h3>
              </div>
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Applicants</p>
                <h3 className="text-2xl font-bold mt-1">{applicants.length}</h3>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Interviews Scheduled</p>
                <h3 className="text-2xl font-bold mt-1">{applicants.filter(a => a.status === 'Interview Scheduled').length}</h3>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hired This Month</p>
                <h3 className="text-2xl font-bold mt-1">8</h3>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applicants">Applicants</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Active Job Postings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobPostings.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>📍 {job.location}</span>
                          <span>🏢 {job.department}</span>
                          <span>⏰ {job.type}</span>
                          <span>📅 Posted {job.postedDate}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{job.applicants}</div>
                        <div className="text-sm text-gray-500">Applicants</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline">Close Position</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applicants">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicants.map((applicant) => (
                  <div key={applicant.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{applicant.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Applied for: {applicant.position}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>📧 {applicant.email}</span>
                          <span>📞 {applicant.phone}</span>
                          <span>💼 {applicant.experience}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge>{applicant.status}</Badge>
                        <span className="text-xs text-gray-500">Applied {applicant.appliedDate}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateApplicantStatus(applicant.id, 'Interview Scheduled')}
                      >
                        Schedule Interview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateApplicantStatus(applicant.id, 'Shortlisted')}
                      >
                        Shortlist
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateApplicantStatus(applicant.id, 'Rejected')}
                      >
                        Reject
                      </Button>
                    </div>
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
