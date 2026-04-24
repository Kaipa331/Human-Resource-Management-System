import { supabase } from './supabase';
import { PayrollService } from './payrollService';
import { PerformanceService } from './performanceService';
import { TrainingService } from './trainingService';
import jsPDF from 'jspdf';

export interface ReportData {
  employees: {
    total: number;
    active: number;
    byDepartment: Record<string, number>;
    byPosition: Record<string, number>;
    byEmploymentType: Record<string, number>;
  };
  payroll: {
    totalGross: number;
    totalNet: number;
    totalTax: number;
    averageSalary: number;
    byDepartment: Record<string, { gross: number; net: number; employees: number }>;
  };
  performance: {
    totalReviews: number;
    averageRating: number;
    byDepartment: Record<string, { rating: number; reviews: number }>;
    ratingDistribution: Record<string, number>;
  };
  training: {
    totalCourses: number;
    totalEnrollments: number;
    completionRate: number;
    byCategory: Record<string, { enrolled: number; completed: number }>;
  };
  attendance: {
    averageAttendance: number;
    byDepartment: Record<string, number>;
    lateArrivals: number;
    absentDays: number;
  };
}

export interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  averagePerformance: number;
  trainingCompletionRate: number;
  attendanceRate: number;
  employeeGrowth: number;
  turnoverRate: number;
}

export class ReportsService {
  // Generate comprehensive HR report
  static async generateHRReport(startDate?: Date, endDate?: Date): Promise<ReportData> {
    try {
      // Get employee data
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('department, position, employment_type, status');

      if (employeeError) throw employeeError;

      // Get payroll data
      const payrollSummary = await PayrollService.getPayrollSummary();

      // Get performance data
      const performanceSummary = await PerformanceService.getPerformanceSummary();
      const performanceMetrics = await PerformanceService.getPerformanceMetrics();

      // Get training data
      const trainingSummary = await TrainingService.getTrainingSummary();
      const trainingStats = await TrainingService.getTrainingStatsByCategory();

      // Get attendance data (mock - would come from attendance table)
      const attendanceData = await this.getAttendanceData();

      // Process employee statistics
      const employeeStats = this.processEmployeeStats(employees || []);

      // Process payroll statistics by department
      const payrollByDept = await this.getPayrollByDepartment();

      // Process performance statistics
      const performanceByDept = this.processPerformanceByDept(performanceMetrics);
      const ratingDistribution = this.getRatingDistribution(performanceMetrics);

      // Process training statistics
      const trainingByCategory = this.processTrainingByCategory(trainingStats);

      return {
        employees: employeeStats,
        payroll: {
          totalGross: payrollSummary.totalGross,
          totalNet: payrollSummary.totalNet,
          totalTax: payrollSummary.totalTax,
          averageSalary: payrollSummary.averageSalary,
          byDepartment: payrollByDept
        },
        performance: {
          totalReviews: performanceSummary.totalReviews,
          averageRating: performanceSummary.averageRating,
          byDepartment: performanceByDept,
          ratingDistribution
        },
        training: {
          totalCourses: trainingSummary.totalCourses,
          totalEnrollments: trainingSummary.totalEnrollments,
          completionRate: trainingSummary.completedEnrollments / (trainingSummary.totalEnrollments || 1) * 100,
          byCategory: trainingByCategory
        },
        attendance: attendanceData
      };
    } catch (error) {
      console.error('Error generating HR report:', error);
      throw error;
    }
  }

  // Get dashboard metrics
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const report = await this.generateHRReport();

      return {
        totalEmployees: report.employees.total,
        activeEmployees: report.employees.active,
        totalPayroll: report.payroll.totalNet,
        averagePerformance: report.performance.averageRating,
        trainingCompletionRate: report.training.completionRate,
        attendanceRate: report.attendance.averageAttendance,
        employeeGrowth: this.calculateEmployeeGrowth(),
        turnoverRate: this.calculateTurnoverRate()
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        totalPayroll: 0,
        averagePerformance: 0,
        trainingCompletionRate: 0,
        attendanceRate: 0,
        employeeGrowth: 0,
        turnoverRate: 0
      };
    }
  }

  // Process employee statistics
  private static processEmployeeStats(employees: any[]) {
    const stats = {
      total: employees.length,
      active: employees.filter(e => e.status === 'Active').length,
      byDepartment: {} as Record<string, number>,
      byPosition: {} as Record<string, number>,
      byEmploymentType: {} as Record<string, number>
    };

    employees.forEach(employee => {
      stats.byDepartment[employee.department] = (stats.byDepartment[employee.department] || 0) + 1;
      stats.byPosition[employee.position] = (stats.byPosition[employee.position] || 0) + 1;
      stats.byEmploymentType[employee.employment_type] = (stats.byEmploymentType[employee.employment_type] || 0) + 1;
    });

    return stats;
  }

  // Get payroll statistics by department
  private static async getPayrollByDepartment(): Promise<Record<string, { gross: number; net: number; employees: number }>> {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          gross_salary,
          net_salary,
          employees:employee_id (
            department
          )
        `);

      if (error) throw error;

      const deptStats: Record<string, { gross: number; net: number; employees: number }> = {};

      (data || []).forEach(payroll => {
        const dept = payroll.employees?.department || 'Unknown';
        
        if (!deptStats[dept]) {
          deptStats[dept] = { gross: 0, net: 0, employees: 0 };
        }

        deptStats[dept].gross += payroll.gross_salary;
        deptStats[dept].net += payroll.net_salary;
        deptStats[dept].employees += 1;
      });

      return deptStats;
    } catch (error) {
      console.error('Error getting payroll by department:', error);
      return {};
    }
  }

  // Process performance statistics by department
  private static processPerformanceByDept(metrics: any[]): Record<string, { rating: number; reviews: number }> {
    const deptStats: Record<string, { rating: number; reviews: number }> = {};

    metrics.forEach(metric => {
      const dept = metric.department;
      
      if (!deptStats[dept]) {
        deptStats[dept] = { rating: 0, reviews: 0 };
      }

      deptStats[dept].rating += metric.currentRating;
      deptStats[dept].reviews += 1;
    });

    // Calculate averages
    Object.keys(deptStats).forEach(dept => {
      deptStats[dept].rating = deptStats[dept].rating / deptStats[dept].reviews;
    });

    return deptStats;
  }

  // Get rating distribution
  private static getRatingDistribution(metrics: any[]): Record<string, number> {
    const distribution = {
      'Excellent (4.5-5.0)': 0,
      'Good (4.0-4.4)': 0,
      'Average (3.0-3.9)': 0,
      'Poor (2.0-2.9)': 0,
      'Very Poor (1.0-1.9)': 0
    };

    metrics.forEach(metric => {
      const rating = metric.currentRating;
      
      if (rating >= 4.5) distribution['Excellent (4.5-5.0)']++;
      else if (rating >= 4.0) distribution['Good (4.0-4.4)']++;
      else if (rating >= 3.0) distribution['Average (3.0-3.9)']++;
      else if (rating >= 2.0) distribution['Poor (2.0-2.9)']++;
      else distribution['Very Poor (1.0-1.9)']++;
    });

    return distribution;
  }

  // Process training statistics by category
  private static processTrainingByCategory(stats: any[]): Record<string, { enrolled: number; completed: number }> {
    const categoryStats: Record<string, { enrolled: number; completed: number }> = {};

    stats.forEach(stat => {
      categoryStats[stat.category] = {
        enrolled: stat.totalEnrollments,
        completed: stat.completedEnrollments
      };
    });

    return categoryStats;
  }

  // Get attendance data (mock implementation)
  private static async getAttendanceData() {
    // In a real implementation, this would come from the attendance table
    return {
      averageAttendance: 95.5,
      byDepartment: {
        'IT': 96.2,
        'HR': 97.1,
        'Finance': 94.8,
        'Sales': 93.5,
        'Marketing': 95.9,
        'Operations': 94.2
      },
      lateArrivals: 45,
      absentDays: 23
    };
  }

  // Calculate employee growth rate
  private static calculateEmployeeGrowth(): number {
    // Mock calculation - in real system this would compare current vs previous period
    return 12.5; // 12.5% growth
  }

  // Calculate turnover rate
  private static calculateTurnoverRate(): number {
    // Mock calculation - in real system this would calculate actual turnover
    return 8.3; // 8.3% turnover rate
  }

  // Export report to different formats
  static async exportReport(
    reportData: ReportData,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<string | null> {
    try {
      switch (format) {
        case 'json':
          return JSON.stringify(reportData, null, 2);
        
        case 'csv':
          return this.convertToCSV(reportData);
        
        case 'pdf':
          return this.convertToPDF(reportData);
        
        default:
          throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      return null;
    }
  }

  // Convert report data to CSV format
  private static convertToCSV(reportData: ReportData): string {
    const csvData = [];
    
    // Employee statistics
    csvData.push('Employee Statistics');
    csvData.push('Department,Count');
    Object.entries(reportData.employees.byDepartment).forEach(([dept, count]) => {
      csvData.push(`${dept},${count}`);
    });
    csvData.push('');

    // Payroll statistics
    csvData.push('Payroll Statistics');
    csvData.push('Department,Gross Pay,Net Pay,Employees');
    Object.entries(reportData.payroll.byDepartment).forEach(([dept, data]) => {
      csvData.push(`${dept},${data.gross},${data.net},${data.employees}`);
    });
    csvData.push('');

    // Performance statistics
    csvData.push('Performance Statistics');
    csvData.push('Department,Average Rating,Reviews');
    Object.entries(reportData.performance.byDepartment).forEach(([dept, data]) => {
      csvData.push(`${dept},${data.rating},${data.reviews}`);
    });
    csvData.push('');

    // Training statistics
    csvData.push('Training Statistics');
    csvData.push('Category,Enrolled,Completed');
    Object.entries(reportData.training.byCategory).forEach(([category, data]) => {
      csvData.push(`${category},${data.enrolled},${data.completed}`);
    });

    return csvData.join('\n');
  }

  private static convertToPDF(reportData: ReportData): string {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;

    const addLine = (
      text: string,
      size = 10,
      color: [number, number, number] = [15, 23, 42],
      bold = false,
    ) => {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.text(text, 14, y);
      y += size >= 12 ? 8 : size >= 10 ? 6 : 5;
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(30, 64, 175);
    pdf.text('HR Analytics Report', 14, y);
    y += 10;

    addLine(`Generated: ${new Date().toLocaleDateString()}`, 9, [100, 116, 139]);
    y += 2;

    addLine('Employees', 12, [30, 41, 59], true);
    addLine(`Total: ${reportData.employees.total}`);
    addLine(`Active: ${reportData.employees.active}`);
    Object.entries(reportData.employees.byDepartment).forEach(([dept, count]) => {
      addLine(`${dept}: ${count}`, 9);
    });

    y += 4;
    addLine('Payroll', 12, [30, 41, 59], true);
    addLine(`Gross: MK ${reportData.payroll.totalGross.toLocaleString()}`);
    addLine(`Net: MK ${reportData.payroll.totalNet.toLocaleString()}`);
    addLine(`Tax: MK ${reportData.payroll.totalTax.toLocaleString()}`);

    y += 4;
    addLine('Performance', 12, [30, 41, 59], true);
    addLine(`Reviews: ${reportData.performance.totalReviews}`);
    addLine(`Average rating: ${reportData.performance.averageRating.toFixed(1)}/5.0`);

    y += 4;
    addLine('Training', 12, [30, 41, 59], true);
    addLine(`Courses: ${reportData.training.totalCourses}`);
    addLine(`Enrollments: ${reportData.training.totalEnrollments}`);
    addLine(`Completion rate: ${reportData.training.completionRate.toFixed(1)}%`);

    y += 4;
    addLine('Attendance', 12, [30, 41, 59], true);
    addLine(`Average attendance: ${reportData.attendance.averageAttendance}%`);
    addLine(`Late arrivals: ${reportData.attendance.lateArrivals}`);
    addLine(`Absent days: ${reportData.attendance.absentDays}`);

    return pdf.output('datauristring');
  }

  // Schedule automated report generation
  static async scheduleReport(
    reportName: string,
    reportType: string,
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually',
    recipients: string[],
    parameters?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('report_schedules')
        .insert([{
          report_name: reportName,
          report_type: reportType,
          frequency,
          recipients,
          parameters,
          next_run: this.calculateNextRunDate(frequency)
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error scheduling report:', error);
      return false;
    }
  }

  // Calculate next run date for scheduled reports
  private static calculateNextRunDate(frequency: string): string {
    const nextDate = new Date();
    
    switch (frequency) {
      case 'Daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'Weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'Monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'Quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'Annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate.toISOString();
  }

  // Get scheduled reports
  static async getScheduledReports(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      return [];
    }
  }
}
