import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { GraduationCap, BookOpen, Award, Clock, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

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
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 'TRN001',
      title: 'Advanced Excel for HR Professionals',
      category: 'Technical Skills',
      duration: '16 hours',
      provider: 'LinkedIn Learning',
      enrolledEmployees: 24,
      completedEmployees: 18,
      status: 'Active',
      startDate: '2026-02-01',
      endDate: '2026-04-30'
    },
    {
      id: 'TRN002',
      title: 'Leadership Development Program',
      category: 'Leadership',
      duration: '40 hours',
      provider: 'Internal Training',
      enrolledEmployees: 15,
      completedEmployees: 8,
      status: 'Active',
      startDate: '2026-01-15',
      endDate: '2026-06-30'
    },
    {
      id: 'TRN003',
      title: 'Workplace Safety & Compliance',
      category: 'Compliance',
      duration: '8 hours',
      provider: 'External Consultant',
      enrolledEmployees: 247,
      completedEmployees: 220,
      status: 'Active',
      startDate: '2026-01-01',
      endDate: '2026-03-31'
    },
  ]);

  const [myTrainings, setMyTrainings] = useState<MyTraining[]>([
    {
      id: 'MY001',
      title: 'React & TypeScript Fundamentals',
      category: 'Technical Skills',
      progress: 85,
      status: 'In Progress',
      dueDate: '2026-04-30',
      completedModules: 17,
      totalModules: 20
    },
    {
      id: 'MY002',
      title: 'Data Protection & Privacy (Malawi DPA)',
      category: 'Compliance',
      progress: 100,
      status: 'Completed',
      dueDate: '2026-02-28',
      completedModules: 6,
      totalModules: 6
    },
    {
      id: 'MY003',
      title: 'Project Management Essentials',
      category: 'Professional Development',
      progress: 40,
      status: 'In Progress',
      dueDate: '2026-05-15',
      completedModules: 4,
      totalModules: 10
    },
  ]);

  const [trainingStats, setTrainingStats] = useState({
    totalCourses: 28,
    activeCourses: 18,
    totalEnrollments: 542,
    completionRate: 76,
    averageRating: 4.3
  });
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [currentEmployeeDbId, setCurrentEmployeeDbId] = useState<string | null>(null);

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
        return { bg: 'bg-gray-50', text: 'text-gray-600' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training & Development</h1>
          <p className="text-gray-500 mt-1">Manage employee training and skill development</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Training Program
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Courses</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.totalCourses}</h3>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Courses</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.activeCourses}</h3>
              </div>
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Enrollments</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.totalEnrollments}</h3>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <h3 className="text-2xl font-bold mt-1">{trainingStats.completionRate}%</h3>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Rating</p>
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
                  <div key={course.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="w-6 h-6 text-blue-600" />
                          <div>
                            <h3 className="text-lg font-semibold">{course.title}</h3>
                            <p className="text-sm text-gray-500">{course.provider}</p>
                          </div>
                        </div>
                      </div>
                      <Badge>{course.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                        <span className="text-gray-600">
                          {course.completedEmployees} / {course.enrolledEmployees}
                        </span>
                      </div>
                      <Progress 
                        value={(course.completedEmployees / course.enrolledEmployees) * 100} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {course.startDate} - {course.endDate}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm" onClick={() => handleEnrollCourse(course.id)}>
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
                  <div key={training.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{training.title}</h3>
                        <p className="text-sm text-gray-500">{training.category}</p>
                      </div>
                      <Badge variant={training.status === 'Completed' ? 'default' : 'secondary'}>
                        {training.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
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

                    <div className="flex gap-2">
                      {training.status === 'Completed' ? (
                        <>
                          <Button size="sm" variant="outline">
                            <Award className="w-4 h-4 mr-2" />
                            View Certificate
                          </Button>
                          <Button size="sm" variant="outline">Review Course</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm">Continue Learning</Button>
                          <Button size="sm" variant="outline">View Schedule</Button>
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
                  <p className="text-sm text-gray-500">No certificates available yet.</p>
                )}
                {certificates.map((cert) => (
                  <div key={cert.id} className="border rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${getCertificateColorClasses(cert.colorClass).bg} rounded-lg`}>
                        <Award className={`w-8 h-8 ${getCertificateColorClasses(cert.colorClass).text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{cert.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Issued on {cert.issuedOn}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">Download Certificate</Button>
                          <Button size="sm" variant="outline">Share</Button>
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
