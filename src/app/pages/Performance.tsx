import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { 
  Plus, 
  Download, 
  TrendingUp, 
  Star, 
  Users, 
  ChevronRight, 
  Target, 
  LayoutDashboard, 
  ClipboardList, 
  Award, 
  Calendar,
  CheckCircle,
  Activity,
  Briefcase,
  Flag,
  FileText
} from 'lucide-react';
import { FormField, FormSection, FormActions } from '../components/ui/form-field';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { PerformanceService } from '../../lib/performanceService';

export function Performance() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    assignmentType: 'individual' as 'individual' | 'department',
    employeeId: '',
    department: '',
    title: '',
    description: '',
    category: '',
    dueDate: ''
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isNewReviewOpen, setIsNewReviewOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [upcomingReviews, setUpcomingReviews] = useState<any[]>([]);
  const [deptProgress, setDeptProgress] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Basic data
      const { data: revs } = await supabase.from('performance_reviews').select('*, employees(name, employee_id)');
      if (revs) setReviews(revs.map(r => ({ ...r, employeeName: r.employees?.name || 'Unknown', employeeCode: r.employees?.employee_id || r.employee_id})));

      const { data: gs } = await supabase.from('performance_goals').select('*, employees(name)');
      if (gs) setGoals(gs);

      const { data: emps } = await supabase.from('employees').select('id, name, department').order('name');
      if (emps) {
        setEmployees(emps);
        const depts = Array.from(new Set(emps.map(e => e.department))).filter(Boolean);
        setDepartments(depts);
      }

      // Aggregated data for dashboard
      const [summ, upcoming, dept, leader] = await Promise.all([
        PerformanceService.getPerformanceSummary(),
        PerformanceService.getUpcomingReviews(),
        PerformanceService.getDepartmentalGoalProgress(),
        PerformanceService.getLeaderboard()
      ]);

      setSummary(summ);
      setUpcomingReviews(upcoming);
      setDeptProgress(dept);
      setLeaderboard(leader);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.dueDate) {
      toast.error('Please fill in required fields');
      return;
    }

    if (newGoal.assignmentType === 'individual' && !newGoal.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (newGoal.assignmentType === 'department' && !newGoal.department) {
      toast.error('Please select a department');
      return;
    }

    try {
      let insertRows = [];

      if (newGoal.assignmentType === 'individual') {
        insertRows.push({
          employee_id: newGoal.employeeId,
          title: newGoal.title,
          description: newGoal.description,
          category: newGoal.category,
          due_date: newGoal.dueDate,
          progress: 0,
          status: 'Not Started'
        });
      } else {
        // Find all employees in the department
        const targetEmps = employees.filter(e => e.department === newGoal.department);
        if (targetEmps.length === 0) {
          toast.error('No employees found in this department');
          return;
        }

        insertRows = targetEmps.map(emp => ({
          employee_id: emp.id,
          department: newGoal.department, // Tag with department
          title: newGoal.title,
          description: newGoal.description,
          category: newGoal.category,
          due_date: newGoal.dueDate,
          progress: 0,
          status: 'Not Started'
        }));
      }

      const { data, error } = await supabase.from('performance_goals').insert(insertRows).select();

      if (error && error.code !== '42P01') throw error;
      
      toast.success(newGoal.assignmentType === 'individual' ? 'Goal assigned' : `Goal assigned to ${insertRows.length} employees`);
      setNewGoal({ assignmentType: 'individual', employeeId: '', department: '', title: '', description: '', category: '', dueDate: '' });
      setIsNewReviewOpen(false);
      
      // Refresh goals
      const { data: refreshedGoals } = await supabase.from('performance_goals').select('*, employees(name)');
      if (refreshedGoals) setGoals(refreshedGoals);

    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Performance Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">Track organizational growth and individual excellence</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" onClick={() => toast.info('Exporting performance data...')} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Dialog open={isNewReviewOpen} onOpenChange={setIsNewReviewOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 px-6 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[96vw] md:w-full max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 px-4 py-4 md:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Assign Goal</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 font-medium">Define growth paths for your workforce</DialogDescription>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <button 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${newGoal.assignmentType === 'individual' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    onClick={() => setNewGoal({...newGoal, assignmentType: 'individual'})}
                  >
                    <Users className="w-4 h-4" />
                    Individual
                  </button>
                  <button 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${newGoal.assignmentType === 'department' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    onClick={() => setNewGoal({...newGoal, assignmentType: 'department'})}
                  >
                    <Briefcase className="w-4 h-4" />
                    Department
                  </button>
                </div>

                <FormSection
                  title="Target Audience"
                  description="Who is this goal for?"
                  icon={<Users className="w-4 h-4 text-blue-600" />}
                  accentColor="border-blue-500"
                >
                  <div className="md:col-span-2">
                    {newGoal.assignmentType === 'individual' ? (
                      <FormField label="Assignee" required hint="Select an individual employee">
                        <Select value={newGoal.employeeId} onValueChange={(v) => setNewGoal({...newGoal, employeeId: v})}>
                          <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11">
                            <SelectValue placeholder="Select an employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.department})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    ) : (
                      <FormField label="Department" required hint="Apply goal to all members of this department">
                        <Select value={newGoal.department} onValueChange={(v) => setNewGoal({...newGoal, department: v})}>
                          <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11">
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title="Goal Definition"
                  description="Outcomes and success criteria"
                  icon={<Flag className="w-4 h-4 text-orange-600" />}
                  accentColor="border-orange-500"
                >
                  <div className="md:col-span-2">
                    <FormField label="Goal Title" required hint="Clear and actionable title">
                      <input 
                        value={newGoal.title} 
                        onChange={e => setNewGoal({...newGoal, title: e.target.value})} 
                        placeholder="e.g., Increase Department Efficiency" 
                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                      />
                    </FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="Strategic Description" hint="How will this goal be measured?">
                      <Textarea 
                        value={newGoal.description} 
                        onChange={e => setNewGoal({...newGoal, description: e.target.value})} 
                        placeholder="Describe the key results..." 
                        rows={3}
                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none resize-none"
                      />
                    </FormField>
                  </div>
                  <FormField label="Category" required>
                    <Select value={newGoal.category} onValueChange={v => setNewGoal({...newGoal, category: v})}>
                      <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Leadership">Leadership</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Target Deadline" required>
                    <input 
                      type="date" 
                      value={newGoal.dueDate} 
                      onChange={e => setNewGoal({...newGoal, dueDate: e.target.value})} 
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </FormField>
                </FormSection>
              </div>

              <div className="p-4 md:p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                <FormActions
                  onCancel={() => setIsNewReviewOpen(false)}
                  onSubmit={handleAddGoal}
                  submitLabel="Activate Performance Goal"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageRating?.toFixed(1) || '0.0'}/5.0</div>
            <p className="text-xs text-muted-foreground">Across all reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.topPerformers || 0}</div>
            <p className="text-xs text-muted-foreground">Rating 4.5 or higher</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <ClipboardList className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalReviews || 0}</div>
            <p className="text-xs text-muted-foreground">{summary?.reviewsThisMonth || 0} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingReviews || 0}</div>
            <p className="text-xs text-muted-foreground">Pending submissions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals & Objectives</TabsTrigger>
          <TabsTrigger value="history">Review History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Performance Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {leaderboard.length > 0 ? leaderboard.map((emp, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 group">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                          {emp.name.charAt(0)}
                        </div>
                        {idx === 0 && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                            <Star className="w-2.5 h-2.5 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.position} • {emp.department}</p>
                      </div>
                      <div className="text-right sm:ml-auto">
                        <p className="text-sm font-bold text-gray-900">{emp.rating.toFixed(1)}/5.0</p>
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {idx === 0 ? 'Top Tier' : 'High Performer'}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-gray-500 text-sm">
                      No ratings recorded yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Upcoming Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingReviews.length > 0 ? upcomingReviews.map((rev, idx) => {
                    const date = new Date(rev.next_review_date);
                    return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 bg-gray-50 border rounded-lg flex flex-col items-center justify-center text-gray-600">
                          <span className="text-[10px] font-bold uppercase">{date.toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{rev.employee?.name}</p>
                          <p className="text-xs text-gray-500">{rev.review_type} Review • {rev.employee?.department}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="self-start sm:self-auto">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-10 text-gray-500 text-sm">
                      No reviews scheduled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm uppercase font-bold text-slate-500">
                    <Activity className="w-4 h-4" />
                    Dept. Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {deptProgress.length > 0 ? deptProgress.map((dept, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold">{dept.name}</span>
                          <span className="text-blue-600 font-bold">{dept.progress}%</span>
                        </div>
                        <Progress value={dept.progress} className="h-1.5" />
                      </div>
                    )) : (
                      <div className="text-center py-4 text-xs text-gray-400">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Goal Explorer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {goals.length > 0 ? goals.map((goal: any) => (
                      <div key={goal.id} className="p-4 border rounded-xl hover:shadow-md transition-all group">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-3">
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{goal.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{goal.category || 'General'}</Badge>
                              <span className="text-[10px] text-gray-400 font-medium">Assigned to: <span className="text-gray-600 dark:text-gray-300 font-bold">{goal.employees?.name || 'Unknown'}</span></span>
                              {goal.department && (
                                <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">Dept: {goal.department}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-lg font-black text-blue-600">{goal.progress}%</div>
                             <Badge className="text-[10px] uppercase">{goal.status}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{goal.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="w-full sm:w-3/4">
                            <Progress value={goal.progress} className="h-1.5 bg-gray-100" />
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">Due: {new Date(goal.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12 text-gray-400 italic text-sm">
                        No active goals found. Use the "New Goal" button to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Performance Review History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.length > 0 ? reviews.map((review) => (
                  <div key={review.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-colors gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{review.employeeName}</h4>
                        <p className="text-sm text-gray-500">{review.review_type} Review • {review.review_period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6 sm:ml-auto">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{review.overall_rating}/5.0</p>
                        <Badge variant={review.status === 'Approved' ? 'default' : 'secondary'} className="text-[10px]">
                          {review.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">Details</Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    No review history found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
