import { supabase } from './supabase';
import { Employee } from '../app/pages/Employees';

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  reviewPeriod: string;
  reviewType: 'Monthly' | 'Quarterly' | 'Annual' | 'Probation';
  
  // Performance ratings (1-5 scale)
  qualityOfWork: number;
  productivity: number;
  teamwork: number;
  communication: number;
  initiative: number;
  attendance: number;
  overallRating: number;
  
  // Review content
  strengths: string;
  areasForImprovement: string;
  goals: string;
  employeeComments: string;
  reviewerComments: string;
  
  // Status and dates
  status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Rejected';
  reviewDate: Date;
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetrics {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  currentRating: number;
  previousRating: number;
  ratingTrend: 'Improving' | 'Declining' | 'Stable';
  goalsCompleted: number;
  totalGoals: number;
  attendanceScore: number;
  productivityScore: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
}

export class PerformanceService {
  // Create a new performance review
  static async createPerformanceReview(
    employeeId: string,
    reviewerId: string,
    reviewPeriod: string,
    reviewType: 'Monthly' | 'Quarterly' | 'Annual' | 'Probation'
  ): Promise<PerformanceReview | null> {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .insert([{
          employee_id: employeeId,
          reviewer_id: reviewerId,
          review_period: reviewPeriod,
          review_type: reviewType,
          quality_of_work: 3,
          productivity: 3,
          teamwork: 3,
          communication: 3,
          initiative: 3,
          attendance: 3,
          overall_rating: 3,
          status: 'Draft',
          review_date: new Date().toISOString().split('T')[0],
          next_review_date: this.calculateNextReviewDate(reviewType)
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating performance review:', error);
      return null;
    }
  }

  // Calculate next review date based on review type
  private static calculateNextReviewDate(reviewType: string): string {
    const nextDate = new Date();
    
    switch (reviewType) {
      case 'Monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'Quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'Annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'Probation':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 3);
    }
    
    return nextDate.toISOString().split('T')[0];
  }

  // Update performance review with ratings and comments
  static async updatePerformanceReview(
    reviewId: string,
    ratings: {
      qualityOfWork: number;
      productivity: number;
      teamwork: number;
      communication: number;
      initiative: number;
      attendance: number;
    },
    content: {
      strengths: string;
      areasForImprovement: string;
      goals: string;
      reviewerComments: string;
    }
  ): Promise<boolean> {
    try {
      const overallRating = (ratings.qualityOfWork + ratings.productivity + 
                            ratings.teamwork + ratings.communication + 
                            ratings.initiative + ratings.attendance) / 6;

      const { error } = await supabase
        .from('performance_reviews')
        .update({
          quality_of_work: ratings.qualityOfWork,
          productivity: ratings.productivity,
          teamwork: ratings.teamwork,
          communication: ratings.communication,
          initiative: ratings.initiative,
          attendance: ratings.attendance,
          overall_rating: overallRating,
          strengths: content.strengths,
          areas_for_improvement: content.areasForImprovement,
          goals: content.goals,
          reviewer_comments: content.reviewerComments,
          status: 'Submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating performance review:', error);
      return false;
    }
  }

  // Get performance reviews for an employee
  static async getEmployeePerformanceReviews(employeeId: string): Promise<PerformanceReview[]> {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          reviewer:reviewer_id (
            name,
            email,
            position
          )
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
      return [];
    }
  }

  // Get all performance reviews (for managers/admins)
  static async getAllPerformanceReviews(): Promise<PerformanceReview[]> {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          employee:employee_id (
            name,
            email,
            employee_id,
            department,
            position
          ),
          reviewer:reviewer_id (
            name,
            email,
            position
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all performance reviews:', error);
      return [];
    }
  }

  // Get performance metrics for dashboard
  static async getPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    try {
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, department, position');

      if (employeeError) throw employeeError;

      const metrics: PerformanceMetrics[] = [];

      for (const employee of employees || []) {
        // Fetch real reviews
        const { data: reviews, error: reviewError } = await supabase
          .from('performance_reviews')
          .select('overall_rating, review_date, next_review_date, attendance, productivity')
          .eq('employee_id', employee.id)
          .order('review_date', { ascending: false })
          .limit(2);

        if (reviewError) throw reviewError;

        const currentReview = reviews?.[0];
        const previousReview = reviews?.[1];

        const currentRating = currentReview?.overall_rating || 0;
        const previousRating = previousReview?.overall_rating || 0;
        
        let ratingTrend: 'Improving' | 'Declining' | 'Stable' = 'Stable';
        if (currentRating > previousRating) ratingTrend = 'Improving';
        else if (currentRating < previousRating) ratingTrend = 'Declining';

        // Calculate goals completion from real goals table
        const { data: goals, error: goalsError } = await supabase
          .from('performance_goals')
          .select('progress')
          .eq('employee_id', employee.id);

        if (goalsError) throw goalsError;

        const totalGoals = goals?.length || 0;
        const goalsCompleted = goals?.filter(g => g.progress === 100).length || 0;
        const avgProgress = totalGoals > 0 
          ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / totalGoals 
          : 0;

        metrics.push({
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          position: employee.position,
          currentRating,
          previousRating,
          ratingTrend,
          goalsCompleted,
          totalGoals,
          attendanceScore: currentReview?.attendance || 0,
          productivityScore: currentReview?.productivity || 0,
          lastReviewDate: currentReview?.review_date ? new Date(currentReview.review_date) : new Date(),
          nextReviewDate: currentReview?.next_review_date ? new Date(currentReview.next_review_date) : new Date()
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }

  // Get performance summary for dashboard
  static async getPerformanceSummary(): Promise<{
    totalReviews: number;
    averageRating: number;
    reviewsThisMonth: number;
    pendingReviews: number;
    topPerformers: number;
    needsImprovement: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select('overall_rating, status, created_at');

      if (error) throw error;

      const reviews = data || [];
      const totalReviews = reviews.length;
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.overall_rating, 0) / reviews.length 
        : 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const reviewsThisMonth = reviews.filter(review => {
        const reviewDate = new Date(review.created_at);
        return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
      }).length;

      const pendingReviews = reviews.filter(review => review.status === 'Draft' || review.status === 'Submitted').length;
      const topPerformers = reviews.filter(review => review.overall_rating >= 4.5).length;
      const needsImprovement = reviews.filter(review => review.overall_rating < 3).length;

      return {
        totalReviews,
        averageRating,
        reviewsThisMonth,
        pendingReviews,
        topPerformers,
        needsImprovement
      };
    } catch (error) {
      console.error('Error fetching performance summary:', error);
      return {
        totalReviews: 0,
        averageRating: 0,
        reviewsThisMonth: 0,
        pendingReviews: 0,
        topPerformers: 0,
        needsImprovement: 0
      };
    }
  }

  // Approve performance review
  static async approvePerformanceReview(reviewId: string, approverComments?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('performance_reviews')
        .update({
          status: 'Approved',
          employee_comments: approverComments || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error approving performance review:', error);
      return false;
    }
  }

  // Reject performance review
  static async rejectPerformanceReview(reviewId: string, rejectionReason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('performance_reviews')
        .update({
          status: 'Rejected',
          employee_comments: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting performance review:', error);
      return false;
    }
  }

  // Get performance trends over time
  static async getPerformanceTrends(employeeId: string): Promise<{
    period: string;
    rating: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select('review_period, overall_rating')
        .eq('employee_id', employeeId)
        .order('review_period', { ascending: true });

      if (error) throw error;

      return (data || []).map(review => ({
        period: review.review_period,
        rating: review.overall_rating
      }));
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      return [];
    }
  }

  // Get upcoming reviews
  static async getUpcomingReviews(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          review_date,
          next_review_date,
          review_type,
          employee:employee_id (
            name,
            department
          )
        `)
        .gte('next_review_date', new Date().toISOString().split('T')[0])
        .order('next_review_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming reviews:', error);
      return [];
    }
  }

  // Get departmental goal progress
  static async getDepartmentalGoalProgress(): Promise<any[]> {
    try {
      // Fetch all employees and their goals
      const { data: goals, error } = await supabase
        .from('performance_goals')
        .select(`
          progress,
          employee:employee_id (
            department
          )
        `);

      if (error) throw error;

      const deptStats: Record<string, { totalProgress: number, count: number, totalObjectives: number }> = {};
      
      (goals || []).forEach(goal => {
        const dept = goal.employee?.department || 'General';
        if (!deptStats[dept]) {
          deptStats[dept] = { totalProgress: 0, count: 0, totalObjectives: 0 };
        }
        deptStats[dept].totalProgress += goal.progress || 0;
        deptStats[dept].count += 1;
        deptStats[dept].totalObjectives += 1; // Assuming each record is one objective
      });

      return Object.entries(deptStats).map(([name, stats]) => ({
        name,
        progress: Math.round(stats.totalProgress / stats.count),
        objectives: `${stats.count}/${stats.totalObjectives}`, // This logic might need refinement
        remainingDays: 0 // Mock for now or calculate from due_date
      }));
    } catch (error) {
      console.error('Error fetching departmental goal progress:', error);
      return [];
    }
  }

  // Get performance leaderboard
  static async getLeaderboard(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          overall_rating,
          employee:employee_id (
            id,
            name,
            position,
            department
          )
        `)
        .order('overall_rating', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Group by employee to get their latest/highest rating
      const uniqueEmployees: Record<string, any> = {};
      (data || []).forEach(review => {
        if (!review.employee) return;
        const empId = review.employee.id;
        if (!uniqueEmployees[empId] || uniqueEmployees[empId].rating < review.overall_rating) {
          uniqueEmployees[empId] = {
            name: review.employee.name,
            position: review.employee.position,
            department: review.employee.department,
            rating: review.overall_rating,
          };
        }
      });

      return Object.values(uniqueEmployees).sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }
}
