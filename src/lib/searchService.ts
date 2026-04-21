import { supabase } from './supabase';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'Employee' | 'Training' | 'Recruitment' | 'Performance' | 'Succession';
  link: string;
  metadata?: any;
}

export class SearchService {
  static async universalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const searchResults: SearchResult[] = [];

    try {
      // 1. Search Employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name, department, position')
        .or(`name.ilike.%${query}%,department.ilike.%${query}%,position.ilike.%${query}%`)
        .limit(5);

      if (employees) {
        employees.forEach(emp => {
          searchResults.push({
            id: emp.id,
            title: emp.name,
            subtitle: `${emp.position} • ${emp.department}`,
            type: 'Employee',
            link: `/app/employees?id=${emp.id}`,
            metadata: emp
          });
        });
      }

      // 2. Search Training Courses
      const { data: courses } = await supabase
        .from('training_courses')
        .select('id, course_name, category')
        .or(`course_name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(3);

      if (courses) {
        courses.forEach(course => {
          searchResults.push({
            id: course.id,
            title: course.course_name,
            subtitle: `Course • ${course.category}`,
            type: 'Training',
            link: `/app/training?courseId=${course.id}`
          });
        });
      }

      // 3. Search Recruitment (Job Postings)
      const { data: jobs } = await supabase
        .from('job_postings')
        .select('id, title, department')
        .or(`title.ilike.%${query}%,department.ilike.%${query}%`)
        .limit(3);

      if (jobs) {
        jobs.forEach(job => {
          searchResults.push({
            id: job.id,
            title: job.title,
            subtitle: `Job • ${job.department}`,
            type: 'Recruitment',
            link: `/app/recruitment?jobId=${job.id}`
          });
        });
      }

      // 4. Search Performance Goals
      const { data: goals } = await supabase
        .from('performance_goals')
        .select('id, title, category, employees(name)')
        .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(3);

      if (goals) {
        goals.forEach((goal: any) => {
          searchResults.push({
            id: goal.id,
            title: goal.title,
            subtitle: `Goal • ${goal.employees?.name || 'Assigned'}`,
            type: 'Performance',
            link: `/app/performance?goalId=${goal.id}`
          });
        });
      }

      return searchResults;
    } catch (error) {
      console.error('Universal Search Error:', error);
      return [];
    }
  }
}
