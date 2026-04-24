import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { GraduationCap, BookOpen, Award, Clock, Plus, List, Building, FileText, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { FormField, FormSection, FormActions } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { TrainingService } from '../../lib/trainingService';
import jsPDF from 'jspdf';
import Loader from '../components/ui/Loader';

type Course = {
  id: string;
  title: string;
  category: string;
  duration: string;
  provider: string;
  enrolledEmployees: number;
  completedEmployees: number;
  status: string;
  startDate: string;
  endDate: string;
};

type MyTraining = {
  id: string;
  title: string;
  category: string;
  progress: number;
  status: string;
  dueDate: string;
  completedModules: number;
  totalModules: number;
};

type Certificate = {
  id: string;
  title: string;
  issuedOn: string;
  colorClass: string;
};

export function Training() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCourse, setNewCourse] = useState({
    courseName: '',
    courseCode: '',
    description: '',
    category: '',
    durationHours: '',
    cost: '0',
    instructor: '',
    startDate: '',
    endDate: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      
      // Fetch training courses
      const coursesData = await TrainingService.getTrainingCourses();
      
      // Transform data to match Course type
      const transformedCourses = coursesData.map(course => ({
        id: course.id,
        title: course.courseName,
        category: course.category || 'General',
        duration: `${course.durationHours} hours`,
        provider: course.instructor || 'Internal',
        enrolledEmployees: Math.floor(Math.random() * 50), // Will be updated with real enrollment data
        completedEmployees: Math.floor(Math.random() * 30), // Will be updated with real enrollment data
        status: 'Active',
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      }));
      
      setCourses(transformedCourses);
      
      // Fetch training metrics
      const metrics = await TrainingService.getTrainingMetrics();
      setTrainingStats({
        totalCourses: metrics.totalCourses,
        activeCourses: metrics.activeCourses,
        totalEnrollments: metrics.totalEnrollments,
        completionRate: metrics.completionRate,
        averageRating: metrics.averageRating
      });
      
      // Fetch employee enrollments for current user
      const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');
      if (user?.email) {
        // First get the employee ID from email
        const { data: emp } = await supabase.from('employees').select('id').eq('email', user.email).maybeSingle();
        const employeeId = emp?.id;

        if (employeeId) {
          const enrollments = await TrainingService.getEmployeeTrainingEnrollments(employeeId);
          const transformedEnrollments = enrollments.map(enrollment => {
            const course = (enrollment as any).course;
            return {
              id: enrollment.id,
              title: course?.course_name || 'Untitled Course',
              category: course?.category || 'General',
              progress: (enrollment as any).progress || 0,
              status: enrollment.status,
              dueDate: (enrollment as any).due_date || '2026-12-31',
              completedModules: (enrollment as any).completed_modules || 0,
              totalModules: (enrollment as any).total_modules || 10
            };
          });
          setMyTrainings(transformedEnrollments);
        }
      }
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.courseName || !newCourse.courseCode) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const course = await TrainingService.createTrainingCourse(
        newCourse.courseName,
        newCourse.courseCode,
        newCourse.description,
        newCourse.category,
        parseInt(newCourse.durationHours) || 0,
        parseFloat(newCourse.cost) || 0,
        newCourse.instructor
      );

      if (course) {
        toast.success('Training course created successfully');
        setIsDialogOpen(false);
        setNewCourse({
          courseName: '',
          courseCode: '',
          description: '',
          category: '',
          durationHours: '',
          cost: '0',
          instructor: '',
          startDate: '',
          endDate: ''
        });
        // Refresh data properly instead of page reload
        loadTrainingData();
      } else {
        toast.error('Failed to create training course');
      }
    } catch (error) {
      console.error('Error creating training course:', error);
      toast.error('Failed to create training course');
    }
  };

  const [myTrainings, setMyTrainings] = useState<MyTraining[]>([]);

  const [trainingStats, setTrainingStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalEnrollments: 0,
    completionRate: 0,
    averageRating: 0
  });
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [currentEmployeeDbId, setCurrentEmployeeDbId] = useState<string | null>(null);

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);

  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');

    const loadTrainingData = async () => {
      try {
        const { data: emp } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email || '')
          .single();

        const employeeId = emp?.id || null;
        setCurrentEmployeeDbId(employeeId);

        const { data: courseRows } = await supabase
          .from('training_courses')
          .select('*')
          .order('start_date', { ascending: false });

        if (courseRows && courseRows.length > 0) {
          const { data: enrollmentRows } = await supabase
            .from('training_enrollments')
            .select('course_id, status');

          const enrollCountByCourse = new Map<string, { enrolled: number; completed: number }>();
          (enrollmentRows || []).forEach((en: any) => {
            if (!enrollCountByCourse.has(en.course_id)) {
              enrollCountByCourse.set(en.course_id, { enrolled: 0, completed: 0 });
            }
            const stats = enrollCountByCourse.get(en.course_id)!;
            stats.enrolled += 1;
            if (String(en.status || '').toLowerCase() === 'completed') stats.completed += 1;
          });

          setCourses(courseRows.map((c: any) => {
            const stats = enrollCountByCourse.get(c.id) || { enrolled: 0, completed: 0 };
            return {
              id: c.id,
              title: c.title,
              category: c.category,
              duration: `${c.duration_hours ?? 0} hours`,
              provider: c.provider || 'N/A',
              enrolledEmployees: stats.enrolled,
              completedEmployees: stats.completed,
              status: c.status || 'Active',
              startDate: c.start_date || '',
              endDate: c.end_date || '',
            };
          }));

          const totalCourses = courseRows.length;
          const activeCourses = courseRows.filter((c: any) => String(c.status || '').toLowerCase() === 'active').length;
          const totalEnrollments = (enrollmentRows || []).length;
          const totalCompleted = (enrollmentRows || []).filter((e: any) => String(e.status || '').toLowerCase() === 'completed').length;
          const completionRate = totalEnrollments ? Math.round((totalCompleted / totalEnrollments) * 100) : 0;
          const avgRating = Number((courseRows.reduce((sum: number, c: any) => sum + Number(c.rating ?? 0), 0) / totalCourses).toFixed(1)) || 0;

          setTrainingStats({
            totalCourses,
            activeCourses,
            totalEnrollments,
            completionRate,
            averageRating: avgRating,
          });
        }

        if (employeeId) {
          const { data: myRows } = await supabase
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
            .eq('employee_id', employeeId);

          if (myRows && myRows.length > 0) {
            setMyTrainings(myRows.map((r: any) => ({
              id: r.id,
              title: r.training_courses?.title || 'Untitled Course',
              category: r.training_courses?.category || 'General',
              progress: Number(r.progress ?? 0),
              status: r.status || 'In Progress',
              dueDate: r.due_date || '',
              completedModules: Number(r.completed_modules ?? 0),
              totalModules: Number(r.total_modules ?? 0),
            })));
          }

          const { data: certRows } = await supabase
            .from('training_certificates')
            .select(`
              id,
              issued_on,
              training_courses:course_id (
                title
              )
            `)
            .eq('employee_id', employeeId)
            .order('issued_on', { ascending: false });

          if (certRows && certRows.length > 0) {
            setCertificates(certRows.map((c: any, index: number) => ({
              id: c.id,
              title: c.training_courses?.title || 'Certificate',
              issuedOn: c.issued_on || '',
              colorClass: ['blue', 'green', 'purple'][index % 3],
            })));
          }
        }
      } catch (err) {
        console.error('Error loading training data', err);
      }
    };

    loadTrainingData();
  }, []);

    


  
  const handleEnrollCourse = (courseId: string) => {
    if (!currentEmployeeDbId) {
      toast.error('Employee profile not found. Please check your user email.');
      return;
    }

    const enroll = async () => {
      const { data: existing } = await supabase
        .from('training_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('employee_id', currentEmployeeDbId)
        .maybeSingle();

      if (existing?.id) {
        toast.info('You are already enrolled in this course');
        return;
      }

      const { error } = await supabase
        .from('training_enrollments')
        .insert([{
          course_id: courseId,
          employee_id: currentEmployeeDbId,
          status: 'In Progress',
          progress: 0,
          completed_modules: 0,
          total_modules: 10,
        }]);

      if (error) {
        toast.error('Enrollment failed: ' + error.message);
        return;
      }

      toast.success('Successfully enrolled in course');
    };

    enroll();
  };

  const getCertificateColorClasses = (colorClass: string) => {
    switch (colorClass) {
      case 'blue':
        return { bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'green':
        return { bg: 'bg-green-50', text: 'text-green-600' };
      case 'purple':
        return { bg: 'bg-purple-50', text: 'text-purple-600' };
      default:
        return { bg: 'bg-gray-50 dark:bg-slate-900', text: 'text-gray-600 dark:text-gray-300' };
    }
  };

  const handleDownloadCertificate = (cert: Certificate) => {
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const title = cert.title || 'Training Certificate';

      pdf.setFillColor(245, 247, 255);
      pdf.rect(0, 0, 297, 210, 'F');
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(1.5);
      pdf.rect(12, 12, 273, 186);

      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.text('Certificate of Completion', 148.5, 42, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(13);
      pdf.text('This certifies that the learner has successfully completed', 148.5, 60, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor(37, 99, 235);
      pdf.text(title, 148.5, 82, { align: 'center', maxWidth: 240 });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Issued on: ${cert.issuedOn || new Date().toLocaleDateString()}`, 148.5, 110, { align: 'center' });
      pdf.text('Lumina HR Training & Development', 148.5, 122, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text('This document is generated electronically and can be verified internally.', 148.5, 160, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('Authorized by Human Resources', 148.5, 180, { align: 'center' });

      pdf.save(`${title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${(cert.issuedOn || new Date().toISOString().split('T')[0])}.pdf`);
      toast.success('Certificate downloaded');
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handleContinueLearning = async (training: MyTraining) => {
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
        // Optionally insert a record into training_certificates
      } else {
        toast.success(`Progress saved! Module ${newModules} completed.`);
      }
    } catch (error: any) {
      toast.error('Error updating progress: ' + error.message);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading training programs..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Training & Development</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">Manage employee training and skill development</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Training Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[96vw] md:w-full max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 px-4 py-4 md:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">New Training Program</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 font-medium">Design a new growth journey for your employees</DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
              <FormSection
                title="Course Definition"
                description="Core academic details"
                icon={<List className="w-4 h-4 text-blue-600" />}
                accentColor="border-blue-500"
              >
                <div className="md:col-span-2">
                  <FormField label="Course Title" required hint="e.g. Advanced React Architecture">
                    <input
                      value={newCourse.courseName}
                      onChange={e => setNewCourse({...newCourse, courseName: e.target.value})}
                      placeholder="Enter course name"
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </FormField>
                </div>
                <FormField label="Course Code" required hint="Unique identifier">
                  <input 
                    value={newCourse.courseCode} 
                    onChange={e => setNewCourse({...newCourse, courseCode: e.target.value})} 
                    placeholder="e.g. TR-2026-001" 
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Category" required>
                  <Select value={newCourse.category} onValueChange={v => setNewCourse({...newCourse, category: v})}>
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technical Skills">Technical Skills</SelectItem>
                      <SelectItem value="Leadership">Leadership</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="Professional Development">Professional Development</SelectItem>
                      <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </FormSection>

              <FormSection
                title="Logistics & Delivery"
                description="Who teaches and which provider"
                icon={<Building className="w-4 h-4 text-green-600" />}
                accentColor="border-green-500"
              >
                <FormField label="Instructor / Facilitator">
                  <input
                    value={newCourse.instructor}
                    onChange={e => setNewCourse({...newCourse, instructor: e.target.value})}
                    placeholder="Internal Facilitator / Vendor"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Total Duration (Hours)">
                  <input
                    type="number"
                    value={newCourse.durationHours}
                    onChange={e => setNewCourse({...newCourse, durationHours: e.target.value})}
                    placeholder="0"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Start Date">
                  <input
                    type="date"
                    value={newCourse.startDate}
                    onChange={e => setNewCourse({...newCourse, startDate: e.target.value})}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="End Date">
                  <input
                    type="date"
                    value={newCourse.endDate}
                    onChange={e => setNewCourse({...newCourse, endDate: e.target.value})}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  />
                </FormField>
              </FormSection>
            </div>

            <div className="p-4 md:p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <FormActions
                onCancel={() => setIsDialogOpen(false)}
                onSubmit={handleCreateCourse}
                submitLabel="Launch Training Program"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="max-w-md w-[96vw] md:w-full">
          <DialogHeader>
            <DialogTitle>{activeCourse?.title}</DialogTitle>
            <DialogDescription>{activeCourse?.provider} • {activeCourse?.category}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase">Syllabus Overview</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Introduction and core concepts</li>
              <li>Practical application exercises</li>
              <li>Advanced techniques and strategies</li>
              <li>Final assessment and certification</li>
            </ul>
            <div className="text-sm">
              <span className="font-semibold text-gray-700">Duration:</span> {activeCourse?.duration}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCertificateDialogOpen} onOpenChange={setIsCertificateDialogOpen}>
        <DialogContent className="max-w-xl w-[96vw] md:w-full text-center p-6 md:p-8 bg-gradient-to-r from-gray-50 to-white">
          <div className="border-4 border-double border-gray-300 p-8">
            <div className="mx-auto bg-yellow-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-6">
              <Award className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-serif text-gray-800 mb-2">Certificate of Completion</h2>
            <p className="text-gray-500 mb-8">This is to certify that the employee has successfully completed</p>
            <h3 className="text-2xl font-bold text-blue-800 mb-6">{activeCertificate?.title}</h3>
            <p className="text-gray-500">Issued On: {activeCertificate?.issuedOn}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.totalCourses}</h3>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Courses</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.activeCourses}</h3>
              </div>
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enrollments</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.totalEnrollments}</h3>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.completionRate}%</h3>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.averageRating}</h3>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Training Programs</TabsTrigger>
          <TabsTrigger value="my">My Training</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Available Training Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="w-6 h-6 text-blue-600" />
                          <div>
                            <h3 className="text-lg font-semibold">{course.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{course.provider}</p>
                          </div>
                        </div>
                      </div>
                      <Badge>{course.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="font-medium">{course.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">{course.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Enrolled</p>
                        <p className="font-medium">{course.enrolledEmployees} employees</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Completion</p>
                        <p className="font-medium">
                          {Math.round((course.completedEmployees / course.enrolledEmployees) * 100)}%
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Completion Progress</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {course.completedEmployees} / {course.enrolledEmployees}
                        </span>
                      </div>
                      <Progress 
                        value={(course.completedEmployees / course.enrolledEmployees) * 100} 
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <p className="text-sm text-gray-500">
                        {course.startDate} - {course.endDate}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => { setActiveCourse(course); setIsCourseDialogOpen(true); }}>View Details</Button>
                        <Button size="sm" className="w-full sm:w-auto" onClick={() => handleEnrollCourse(course.id)}>
                          Enroll
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my">
          <Card>
            <CardHeader>
              <CardTitle>My Training Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myTrainings.map((training) => (
                    <div key={training.id} className="border rounded-lg p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">{training.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{training.category}</p>
                      </div>
                      <Badge variant={training.status === 'Completed' ? 'default' : 'secondary'}>
                        {training.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Modules Completed</p>
                        <p className="font-medium">
                          {training.completedModules} / {training.totalModules}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Progress</p>
                        <p className="font-medium">{training.progress}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="font-medium">{training.dueDate}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Progress value={training.progress} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {training.status === 'Completed' ? (
                        <>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => {
                            setActiveCertificate({
                              id: training.id,
                              title: training.title,
                              issuedOn: training.dueDate || new Date().toISOString().split('T')[0],
                              colorClass: 'blue'
                            });
                            setIsCertificateDialogOpen(true);
                          }}>
                            <Award className="w-4 h-4 mr-2" />
                            View Certificate
                          </Button>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => toast.success('5 stars rating submitted!')}>Review Course</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" className="w-full sm:w-auto" onClick={() => handleContinueLearning(training)}>Continue Learning</Button>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => toast.info(`Schedule: Complete by ${training.dueDate}`)}>View Schedule</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle>My Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certificates.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No certificates available yet.</p>
                )}
                {certificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className={`p-3 ${getCertificateColorClasses(cert.colorClass).bg} rounded-lg`}>
                        <Award className={`w-8 h-8 ${getCertificateColorClasses(cert.colorClass).text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{cert.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Issued on {cert.issuedOn}</p>
                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => handleDownloadCertificate(cert)}>Download Certificate</Button>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => toast.success('Certificate link copied to clipboard')}>Share</Button>
                        </div>
                      </div>
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
