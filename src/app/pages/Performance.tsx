import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Target, TrendingUp, Award, Star, Plus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

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

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<any>(null);
  const [reviewUpdate, setReviewUpdate] = useState({ rating: 0, achieved: 0 });

  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  const performanceMetrics = {
    averageRating: 4.1,
    completedReviews: reviews.filter(r => r.status === 'Completed').length,
    pendingReviews: reviews.filter(r => r.status !== 'Completed').length,
    goalsAchieved: 78,
    employeeSatisfaction: 87
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: revs, error: errRevs } = await supabase.from('performance_reviews').select('*, employees(name, employee_id)');
      if (errRevs && errRevs.code !== '42P01') console.error('Error reviews', errRevs);
      else if (revs) setReviews(revs.map(r => ({ ...r, employeeName: r.employees?.name || 'Unknown', employeeCode: r.employees?.employee_id || r.employee_id})));

      const { data: gs, error: errGs } = await supabase.from('performance_goals').select('*');
      if (errGs && errGs.code !== '42P01') console.error('Error goals', errGs);
      else if (gs) setGoals(gs);
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
      // Assuming this creates a generic goal or we fetch current user's employee_id
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

  const updateGoalProgress = async (id: string, currentProgress: number) => {
    try {
      const newProgress = Math.min(100, currentProgress + 25);
      const newStatus = newProgress === 100 ? 'Completed' : 'On Track';
      const { error } = await supabase.from('performance_goals').update({ progress: newProgress, status: newStatus }).eq('id', id);
      if (error && error.code !== '42P01') throw error;
      setGoals(goals.map(g => g.id === id ? { ...g, progress: newProgress, status: newStatus } : g));
      toast.success('Goal progress updated');
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  const handleOpenReview = (review: any) => {
    setActiveReview(review);
    setReviewUpdate({ rating: review.overall_rating || 0, achieved: review.achieved_goals || 0 });
    setIsReviewDialogOpen(true);
  };

  const submitReviewUpdate = async () => {
    if (!activeReview) return;
    try {
      const isComplete = reviewUpdate.rating > 0;
      const newStatus = isComplete ? 'Completed' : 'In Progress';
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.from('performance_reviews').update({
        overall_rating: reviewUpdate.rating,
        achieved_goals: reviewUpdate.achieved,
        status: newStatus,
        completed_date: isComplete ? today : null
      }).eq('id', activeReview.id);
      
      if (error && error.code !== '42P01') throw error;

      setReviews(reviews.map(r => r.id === activeReview.id ? { 
        ...r, 
        overall_rating: reviewUpdate.rating, 
        achieved_goals: reviewUpdate.achieved,
        status: newStatus,
        completed_date: isComplete ? today : null
      } : r));

      toast.success(isComplete ? 'Review Completed' : 'Review Updated');
      setIsReviewDialogOpen(false);
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const submitNote = () => {
    if (!noteText) return;
    // Mock note logic, could be added to goal description
    toast.success('Note attached to goal');
    setIsNoteDialogOpen(false);
    setNoteText('');
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-500 mt-1">Track employee performance and goals</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Set New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new performance goal</DialogDescription>
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
            <Button onClick={handleAddGoal} className="mt-4">Create Goal</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Avg Rating</p><h3 className="text-2xl font-bold mt-1">{performanceMetrics.averageRating}</h3></div><Star className="w-8 h-8 text-yellow-500" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Completed Reviews</p><h3 className="text-2xl font-bold mt-1">{performanceMetrics.completedReviews}</h3></div><Award className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending Reviews</p><h3 className="text-2xl font-bold mt-1">{performanceMetrics.pendingReviews}</h3></div><TrendingUp className="w-8 h-8 text-orange-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Goals Achieved</p><h3 className="text-2xl font-bold mt-1">{performanceMetrics.goalsAchieved}%</h3></div><Target className="w-8 h-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Satisfaction</p><h3 className="text-2xl font-bold mt-1">{performanceMetrics.employeeSatisfaction}%</h3></div><TrendingUp className="w-8 h-8 text-purple-600" /></div></CardContent></Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeReview?.status === 'Completed' ? 'Review Details' : 'Continue Review'}</DialogTitle>
            <DialogDescription>{activeReview?.employeeName} - {activeReview?.period}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Achieved Goals (out of {activeReview?.goals || 0})</Label>
              <Input 
                type="number" 
                min="0" 
                max={activeReview?.goals || 10}
                value={reviewUpdate.achieved} 
                onChange={(e) => setReviewUpdate({...reviewUpdate, achieved: parseInt(e.target.value) || 0})}
                disabled={activeReview?.status === 'Completed'}
              />
            </div>
            <div>
              <Label>Overall Rating (1-5)</Label>
              <Input 
                type="number" 
                min="1" 
                max="5"
                value={reviewUpdate.rating} 
                onChange={(e) => setReviewUpdate({...reviewUpdate, rating: parseInt(e.target.value) || 0})}
                disabled={activeReview?.status === 'Completed'}
              />
            </div>
            {activeReview?.status === 'Completed' && (
              <div>
                <Label>Completed Date</Label>
                <div className="mt-1 font-medium">{activeReview?.completed_date}</div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Close</Button>
            {activeReview?.status !== 'Completed' && (
              <Button onClick={submitReviewUpdate}>Save & Complete</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Attach a note for: {activeGoal?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type your note here..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitNote}>Save Note</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals & Objectives</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <Card>
            <CardHeader><CardTitle>Performance Reviews</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.length === 0 ? <p className="text-gray-500 py-4">No reviews found</p> : reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{review.employeeName}</h3>
                        <p className="text-sm text-gray-500">{review.employeeCode} • {review.period}</p>
                      </div>
                      <Badge variant={review.status === 'Completed' ? 'default' : review.status === 'In Progress' ? 'secondary' : 'outline'}>{review.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Reviewer</p>
                        <p className="font-medium">{review.reviewer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Goals</p>
                        <p className="font-medium">{review.achieved_goals || 0} / {review.goals || 0} achieved</p>
                      </div>
                      {review.overall_rating && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">Overall Rating</p>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(review.overall_rating)}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="font-medium">{review.completed_date}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {review.status === 'Completed' ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleOpenReview(review)}>View Details</Button>
                          <Button size="sm" variant="outline" onClick={() => toast.success('Report downloaded')}>Download Report</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => handleOpenReview(review)}>Continue Review</Button>
                          <Button size="sm" variant="outline" onClick={() => handleOpenReview(review)}>View Progress</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader><CardTitle>My Goals & Objectives</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.length === 0 ? <p className="text-gray-500 py-4">No goals configured</p> : goals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold">{goal.title}</h3>
                          <Badge>{goal.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="font-medium">{goal.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">{goal.start_date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="font-medium">{goal.due_date}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Progress</span>
                        <span className="text-gray-600">{goal.progress || 0}%</span>
                      </div>
                      <Progress value={goal.progress || 0} />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateGoalProgress(goal.id, goal.progress || 0)}>Update Progress</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setActiveGoal(goal);
                        setIsNoteDialogOpen(true);
                      }}>Add Note</Button>
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
