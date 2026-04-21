import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
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
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { PerformanceService } from '../../lib/performanceService';

export function Performance() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    dueDate: ''
  });
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

      const { data: gs } = await supabase.from('performance_goals').select('*');
      if (gs) setGoals(gs);

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

    try {
      const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');
      const { data: empData } = await supabase.from('employees').select('id').eq('email', user?.email || '').maybeSingle();
      const employeeId = empData?.id;

      if (!employeeId) {
        toast.error('You need an linked employee account to post a goal.');
        return;
      }

      const { data, error } = await supabase.from('performance_goals').insert([{
        employee_id: employeeId,
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        due_date: newGoal.dueDate,
        progress: 0,
        status: 'Not Started'
      }]).select();

      if (error && error.code !== '42P01') throw error;
      
      if (data) {
        setGoals([...goals, data[0]]);
      } else {
        setGoals([...goals, { ...newGoal, id: 'tmp'+Date.now(), progress: 0, status: 'Not Started', start_date: new Date().toISOString() }]);
      }
      toast.success('Goal created successfully');
      setNewGoal({ title: '', description: '', category: '', dueDate: '' });
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track organizational growth and individual excellence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info('Exporting performance data...')}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Dialog open={isNewReviewOpen} onOpenChange={setIsNewReviewOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>Set a new performance goal for yourself</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Goal Title</Label>
                  <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Complete certification" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Describe the goal..." rows={3} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })} placeholder="e.g. Skills Development" />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={newGoal.dueDate} onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleAddGoal} className="mt-4 w-full">Create Goal</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <div key={idx} className="flex items-center gap-4 group">
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
                      <div className="text-right">
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
                      <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 bg-gray-50 border rounded-lg flex flex-col items-center justify-center text-gray-600">
                          <span className="text-[10px] font-bold uppercase">{date.toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{rev.employee?.name}</p>
                          <p className="text-xs text-gray-500">{rev.review_type} Review • {rev.employee?.department}</p>
                        </div>
                        <Button variant="ghost" size="icon">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Departmental Goal Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {deptProgress.length > 0 ? deptProgress.map((dept, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{dept.name}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{dept.progress}%</span>
                    </div>
                    <Progress value={dept.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {dept.objectives} Active Objectives
                      </span>
                      <span>Updated recently</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    No departmental goals tracking currently active
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Performance Review History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.length > 0 ? reviews.map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{review.employeeName}</h4>
                        <p className="text-sm text-gray-500">{review.review_type} Review • {review.review_period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
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
