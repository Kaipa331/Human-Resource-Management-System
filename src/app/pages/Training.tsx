import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { GraduationCap, BookOpen, Award, Clock, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export function Training() {
  const [courses, setCourses] = useState([
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

  const [myTrainings, setMyTrainings] = useState([
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

  const trainingStats = {
    totalCourses: 28,
    activeCourses: 18,
    totalEnrollments: 542,
    completionRate: 76,
    averageRating: 4.3
  };

  const handleEnrollCourse = (courseId: string) => {
    toast.success('Successfully enrolled in course');
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
                <div className="border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Award className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Data Protection & Privacy (Malawi DPA)</h3>
                      <p className="text-sm text-gray-500 mt-1">Issued on February 28, 2026</p>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">Download Certificate</Button>
                        <Button size="sm" variant="outline">Share</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Award className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Workplace Safety & Compliance</h3>
                      <p className="text-sm text-gray-500 mt-1">Issued on January 20, 2026</p>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">Download Certificate</Button>
                        <Button size="sm" variant="outline">Share</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Basic First Aid Training</h3>
                      <p className="text-sm text-gray-500 mt-1">Issued on December 15, 2025</p>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">Download Certificate</Button>
                        <Button size="sm" variant="outline">Share</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
