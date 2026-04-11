import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Briefcase, Users, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export function Recruitment() {
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState<any>(null);

  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: jobs, error: errJobs } = await supabase.from('job_postings').select('*');
      if (errJobs && errJobs.code !== '42P01') console.error('Error jobs', errJobs);
      else if (jobs) setJobPostings(jobs);

      const { data: apps, error: errApps } = await supabase.from('job_applicants').select('*');
      if (errApps && errApps.code !== '42P01') console.error('Error apps', errApps);
      else if (apps) setApplicants(apps);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async () => {
    if (!newJob.title || !newJob.department) {
      toast.error('Please fill in required fields');
      return;
    }
    try {
      const { data, error } = await supabase.from('job_postings').insert([{
        title: newJob.title,
        department: newJob.department,
        location: newJob.location,
        type: newJob.type,
        description: newJob.description,
        status: 'Open',
        applicants: 0
      }]).select();

      if (error && error.code !== '42P01') throw error;
      
      if (data) {
        setJobPostings([...jobPostings, data[0]]);
      } else {
        // Fallback if table does not exist
        setJobPostings([...jobPostings, { ...newJob, id: 'tmp'+Date.now(), applicants: 0, status: 'Open', posted_date: new Date().toISOString() }]);
      }
      toast.success('Job posting created');
      setNewJob({ title: '', department: '', location: '', type: '', description: '' });
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const updateApplicantStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('job_applicants').update({ status: newStatus }).eq('id', id);
      if (error && error.code !== '42P01') throw error;
      setApplicants(applicants.map(app => app.id === id ? { ...app, status: newStatus } : app));
      toast.success(`Applicant status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const toggleJobStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
    try {
      const { error } = await supabase.from('job_postings').update({ status: newStatus }).eq('id', id);
      if (error && error.code !== '42P01') throw error;
      setJobPostings(jobPostings.map(job => job.id === id ? { ...job, status: newStatus } : job));
      toast.success(`Job marked as ${newStatus}`);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  }

  const openViewDialog = (job: any) => {
    setViewingJob(job);
    setIsViewDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recruitment & Hiring</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage job postings and applicant tracking</p>
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
                <Input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department *</Label>
                  <Select value={newJob.department} onValueChange={(val) => setNewJob({ ...newJob, department: val })}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
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
                  <Input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} placeholder="Lilongwe, Blantyre, etc." />
                </div>
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select value={newJob.type} onValueChange={(val) => setNewJob({ ...newJob, type: val })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
                <Textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} placeholder="Enter job description, requirements, and responsibilities..." rows={6} />
              </div>
            </div>
            <Button onClick={handleAddJob} className="mt-4">Post Job</Button>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>Full description of the job posting</DialogDescription>
            </DialogHeader>
            {viewingJob && (
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div>
                    <h3 className="text-lg font-bold">{viewingJob.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{viewingJob.department}</p>
                  </div>
                  <Badge variant={viewingJob.status === 'Open' ? 'default' : 'secondary'}>
                    {viewingJob.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-y-4 text-sm mt-4">
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{viewingJob.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Employment Type</p>
                    <p className="font-medium">{viewingJob.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Posted Date</p>
                    <p className="font-medium">{viewingJob.posted_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Applicants</p>
                    <p className="font-medium">{viewingJob.applicants}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Description</p>
                    <p className="font-medium mt-1 whitespace-pre-wrap">{viewingJob.description}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 dark:text-gray-400">Open Positions</p><h3 className="text-2xl font-bold mt-1">{jobPostings.filter(j => j.status === 'Open').length}</h3></div><Briefcase className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Applicants</p><h3 className="text-2xl font-bold mt-1">{applicants.length}</h3></div><Users className="w-8 h-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 dark:text-gray-400">Interviews Scheduled</p><h3 className="text-2xl font-bold mt-1">{applicants.filter(a => a.status === 'Interview Scheduled').length}</h3></div><Calendar className="w-8 h-8 text-orange-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 dark:text-gray-400">Hired This Month</p><h3 className="text-2xl font-bold mt-1">0</h3></div><CheckCircle className="w-8 h-8 text-purple-600" /></div></CardContent></Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applicants">Applicants</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader><CardTitle>Active Job Postings</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobPostings.length === 0 ? <p className="text-gray-500 dark:text-gray-400 py-4">No job postings</p> : jobPostings.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>{job.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>📍 {job.location}</span>
                          <span>🏢 {job.department}</span>
                          <span>⏰ {job.type}</span>
                          <span>📅 Posted {job.posted_date || new Date().toISOString().split('T')[0]}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{job.applicants || 0}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Applicants</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => openViewDialog(job)}>View Details</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleJobStatus(job.id, job.status)}>{job.status === 'Open' ? 'Close Position' : 'Reopen Position'}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applicants">
          <Card>
            <CardHeader><CardTitle>Applicant Pipeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicants.length === 0 ? <p className="text-gray-500 dark:text-gray-400 py-4">No applicants</p> : applicants.map((applicant) => (
                  <div key={applicant.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{applicant.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Applied for: {applicant.position || 'Open Role'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                          <span>📧 {applicant.email}</span>
                          <span>📞 {applicant.phone}</span>
                          <span>�� {applicant.experience}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge>{applicant.status}</Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Applied {applicant.applied_date || new Date().toISOString().split('T')[0]}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => updateApplicantStatus(applicant.id, 'Interview Scheduled')}>Schedule Interview</Button>
                      <Button size="sm" variant="outline" onClick={() => updateApplicantStatus(applicant.id, 'Shortlisted')}>Shortlist</Button>
                      <Button size="sm" variant="outline" onClick={() => updateApplicantStatus(applicant.id, 'Rejected')}>Reject</Button>
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
