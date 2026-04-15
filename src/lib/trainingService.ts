import { supabase } from './supabase';

export interface TrainingCourse {
  id: string;
  courseName: string;
  courseCode: string;
  description: string;
  category: string;
  durationHours: number;
  cost: number;
  instructor: string;
  status: 'Active' | 'Inactive' | 'Archived';
  createdAt: Date;
}

export interface TrainingEnrollment {
  id: string;
  employeeId: string;
  courseId: string;
  enrollmentDate: Date;
  completionDate?: Date;
  status: 'Enrolled' | 'In Progress' | 'Completed' | 'Dropped' | 'Failed';
  score?: number;
  certificateIssued: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingMetrics {
  employeeId: string;
  employeeName: string;
  department: string;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  averageScore: number;
  totalHours: number;
  certificatesEarned: number;
  lastActivity: Date;
}

export class TrainingService {
  // Create a new training course
  static async createTrainingCourse(
    courseName: string,
    courseCode: string,
    description: string,
    category: string,
    durationHours: number,
    cost: number,
    instructor: string
  ): Promise<TrainingCourse | null> {
    try {
      const { data, error } = await supabase
        .from('training_courses')
        .insert([{
          course_name: courseName,
          course_code: courseCode,
          description,
          category,
          duration_hours: durationHours,
          cost,
          instructor,
          status: 'Active'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating training course:', error);
      return null;
    }
  }

  // Get all training courses
  static async getTrainingCourses(): Promise<TrainingCourse[]> {
    try {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .order('course_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching training courses:', error);
      return [];
    }
  }

  // Get active training courses
  static async getActiveTrainingCourses(): Promise<TrainingCourse[]> {
    try {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('status', 'Active')
        .order('course_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active training courses:', error);
      return [];
    }
  }

  // Enroll employee in a training course
  static async enrollEmployeeInCourse(
    employeeId: string,
    courseId: string
  ): Promise<TrainingEnrollment | null> {
    try {
      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('training_enrollments')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('course_id', courseId)
        .single();

      if (existingEnrollment) {
        console.error('Employee already enrolled in this course');
        return null;
      }

      const { data, error } = await supabase
        .from('training_enrollments')
        .insert([{
          employee_id: employeeId,
          course_id: courseId,
          enrollment_date: new Date().toISOString().split('T')[0],
          status: 'Enrolled'
        }])
        .select(`
          *,
          course:course_id (
            course_name,
            course_code,
            duration_hours,
            category
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enrolling employee in course:', error);
      return null;
    }
  }

  // Update training enrollment
  static async updateTrainingEnrollment(
    enrollmentId: string,
    updates: {
      status?: 'Enrolled' | 'In Progress' | 'Completed' | 'Dropped' | 'Failed';
      score?: number;
      completionDate?: Date;
      certificateIssued?: boolean;
      notes?: string;
    }
  ): Promise<boolean> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.completionDate) {
        updateData.completion_date = updates.completionDate.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('training_enrollments')
        .update(updateData)
        .eq('id', enrollmentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating training enrollment:', error);
      return false;
    }
  }

  // Get training enrollments for an employee
  static async getEmployeeTrainingEnrollments(employeeId: string): Promise<TrainingEnrollment[]> {
    try {
      const { data, error } = await supabase
        .from('training_enrollments')
        .select(`
          *,
          course:course_id (
            course_name,
            course_code,
            description,
            category,
            duration_hours,
            instructor
          )
        `)
        .eq('employee_id', employeeId)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching training enrollments:', error);
      return [];
    }
  }

  // Get all training enrollments (for managers/admins)
  static async getAllTrainingEnrollments(): Promise<TrainingEnrollment[]> {
    try {
      const { data, error } = await supabase
        .from('training_enrollments')
        .select(`
          *,
          employee:employee_id (
            name,
            email,
            employee_id,
            department,
            position
          ),
          course:course_id (
            course_name,
            course_code,
            category,
            duration_hours,
            instructor
          )
        `)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all training enrollments:', error);
      return [];
    }
  }

  // Get training metrics for dashboard
  static async getTrainingMetrics(): Promise<TrainingMetrics[]> {
    try {
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, department');

      if (employeeError) throw employeeError;

      const metrics: TrainingMetrics[] = [];

      for (const employee of employees || []) {
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('training_enrollments')
          .select('status, score, updated_at')
          .eq('employee_id', employee.id);

        if (enrollmentError) throw enrollmentError;

        const totalCourses = enrollments?.length || 0;
        const completedCourses = enrollments?.filter(e => e.status === 'Completed').length || 0;
        const inProgressCourses = enrollments?.filter(e => e.status === 'In Progress').length || 0;
        
        const scores = enrollments?.filter(e => e.score !== null).map(e => e.score) || [];
        const averageScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
          : 0;

        // Calculate total hours (mock data - in real system this would come from course data)
        const totalHours = completedCourses * 20; // Assuming 20 hours per completed course

        const certificatesEarned = completedCourses;
        const lastActivity = enrollments?.length > 0 
          ? new Date(Math.max(...enrollments.map(e => new Date(e.updated_at).getTime())))
          : new Date();

        metrics.push({
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          totalCourses,
          completedCourses,
          inProgressCourses,
          averageScore,
          totalHours,
          certificatesEarned,
          lastActivity
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching training metrics:', error);
      return [];
    }
  }

  // Get training summary for dashboard
  static async getTrainingSummary(): Promise<{
    totalCourses: number;
    activeCourses: number;
    totalEnrollments: number;
    completedEnrollments: number;
    inProgressEnrollments: number;
    averageScore: number;
    totalTrainingHours: number;
  }> {
    try {
      const { data: courses, error: courseError } = await supabase
        .from('training_courses')
        .select('status');

      if (courseError) throw courseError;

      const { data: enrollments, error: enrollmentError } = await supabase
        .from('training_enrollments')
        .select('status, score');

      if (enrollmentError) throw enrollmentError;

      const totalCourses = courses?.length || 0;
      const activeCourses = courses?.filter(c => c.status === 'Active').length || 0;
      
      const totalEnrollments = enrollments?.length || 0;
      const completedEnrollments = enrollments?.filter(e => e.status === 'Completed').length || 0;
      const inProgressEnrollments = enrollments?.filter(e => e.status === 'In Progress').length || 0;
      
      const scores = enrollments?.filter(e => e.score !== null).map(e => e.score) || [];
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

      const totalTrainingHours = completedEnrollments * 20; // Assuming 20 hours per completed course

      return {
        totalCourses,
        activeCourses,
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        averageScore,
        totalTrainingHours
      };
    } catch (error) {
      console.error('Error fetching training summary:', error);
      return {
        totalCourses: 0,
        activeCourses: 0,
        totalEnrollments: 0,
        completedEnrollments: 0,
        inProgressEnrollments: 0,
        averageScore: 0,
        totalTrainingHours: 0
      };
    }
  }

  // Get training statistics by category
  static async getTrainingStatsByCategory(): Promise<{
    category: string;
    totalEnrollments: number;
    completedEnrollments: number;
    averageScore: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('training_enrollments')
        .select(`
          status,
          score,
          course:course_id (
            category
          )
        `);

      if (error) throw error;

      const categoryStats: Record<string, {
        totalEnrollments: number;
        completedEnrollments: number;
        scores: number[];
      }> = {};

      (data || []).forEach(enrollment => {
        const category = enrollment.course?.category || 'Unknown';
        
        if (!categoryStats[category]) {
          categoryStats[category] = {
            totalEnrollments: 0,
            completedEnrollments: 0,
            scores: []
          };
        }

        categoryStats[category].totalEnrollments++;
        
        if (enrollment.status === 'Completed') {
          categoryStats[category].completedEnrollments++;
        }
        
        if (enrollment.score !== null) {
          categoryStats[category].scores.push(enrollment.score);
        }
      });

      return Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        totalEnrollments: stats.totalEnrollments,
        completedEnrollments: stats.completedEnrollments,
        averageScore: stats.scores.length > 0 
          ? stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length 
          : 0
      }));
    } catch (error) {
      console.error('Error fetching training stats by category:', error);
      return [];
    }
  }

  // Update course status
  static async updateCourseStatus(
    courseId: string,
    status: 'Active' | 'Inactive' | 'Archived'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('training_courses')
        .update({ status })
        .eq('id', courseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating course status:', error);
      return false;
    }
  }

  // Delete training course
  static async deleteTrainingCourse(courseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('training_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting training course:', error);
      return false;
    }
  }
}
