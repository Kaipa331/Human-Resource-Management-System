import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Target, TrendingUp, Award, Star, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

export function Performance() {
  const [reviews, setReviews] = useState([
    {
      id: 'REV001',
      employeeName: 'John Doe',
      employeeId: 'EMP001',
      period: 'Q1 2026',
      reviewer: 'HR Manager',
      status: 'Completed',
      overallRating: 4.2,
      completedDate: '2026-03-10',
      goals: 5,
      achievedGoals: 4
    },
    {
      id: 'REV002',
      employeeName: 'Sarah Williams',
      employeeId: 'EMP002',
      period: 'Q1 2026',
      reviewer: 'CEO',
      status: 'In Progress',
      overallRating: null,
      completedDate: null,
      goals: 6,
      achievedGoals: 5
    },
    {
      id: 'REV003',
      employeeName: 'Michael Brown',
      employeeId: 'EMP003',
      period: 'Q1 2026',
      reviewer: 'Sales Manager',
      status: 'Pending',
      overallRating: null,
      completedDate: null,
      goals: 4,
      achievedGoals: 3
    },
  ]);

  const [goals, setGoals] = useState([
    {
      id: 'GOAL001',
      title: 'Complete React Training',
      description: 'Finish advanced React course and certification',
      category: 'Skills Development',
      startDate: '2026-01-01',
      dueDate: '2026-03-31',
      progress: 85,
      status: 'On Track'
    },
    {
      id: 'GOAL002',
      title: 'Improve Customer Satisfaction',
      description: 'Achieve 90% customer satisfaction score',
      category: 'Performance',
      startDate: '2026-01-01',
      dueDate: '2026-06-30',
      progress: 60,
      status: 'On Track'
    },
    {
      id: 'GOAL003',
      title: 'Lead 2 Projects',
      description: 'Successfully lead and deliver 2 major projects',
      category: 'Leadership',
      startDate: '2026-01-01',
      dueDate: '2026-12-31',
      progress: 50,
      status: 'In Progress'
    },
  ]);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    dueDate: ''
  });

  const performanceMetrics = {
    averageRating: 4.1,
    completedReviews: 156,
    pendingReviews: 18,
    goalsAchieved: 78,
    employeeSatisfaction: 87
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.dueDate) {
      toast.error('Please fill in required fields');
      return;
    }
    const goalId = `GOAL${String(goals.length + 1).padStart(3, '0')}`;
    setGoals([...goals, {
      id: goalId,
      ...newGoal,
      startDate: new Date().toISOString().split('T')[0],
      progress: 0,
      status: 'Not Started'
    }]);
    setNewGoal({ title: '', description: '', category: '', dueDate: '' });
    toast.success('Goal created successfully');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

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
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. Complete certification"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Describe the goal..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  placeholder="e.g. Skills Development"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newGoal.dueDate}
                  onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAddGoal} className="mt-4">Create Goal</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Rating</p>
                <h3 className="text-2xl font-bold mt-1">{performanceMetrics.averageRating}</h3>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Reviews</p>
                <h3 className="text-2xl font-bold mt-1">{performanceMetrics.completedReviews}</h3>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Reviews</p>
                <h3 className="text-2xl font-bold mt-1">{performanceMetrics.pendingReviews}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Goals Achieved</p>
                <h3 className="text-2xl font-bold mt-1">{performanceMetrics.goalsAchieved}%</h3>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Satisfaction</p>
                <h3 className="text-2xl font-bold mt-1">{performanceMetrics.employeeSatisfaction}%</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals & Objectives</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews - Q1 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{review.employeeName}</h3>
                        <p className="text-sm text-gray-500">{review.employeeId} • {review.period}</p>
                      </div>
                      <Badge variant={
                        review.status === 'Completed' ? 'default' : 
                        review.status === 'In Progress' ? 'secondary' : 'outline'
                      }>
                        {review.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Reviewer</p>
                        <p className="font-medium">{review.reviewer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Goals</p>
                        <p className="font-medium">{review.achievedGoals} / {review.goals} achieved</p>
                      </div>
                      {review.overallRating && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">Overall Rating</p>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(review.overallRating)}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="font-medium">{review.completedDate}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {review.status === 'Completed' ? (
                        <>
                          <Button size="sm" variant="outline">View Details</Button>
                          <Button size="sm" variant="outline">Download Report</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm">Continue Review</Button>
                          <Button size="sm" variant="outline">View Progress</Button>
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
            <CardHeader>
              <CardTitle>My Goals & Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
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
                        <p className="font-medium">{goal.startDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="font-medium">{goal.dueDate}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Progress</span>
                        <span className="text-gray-600">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Update Progress</Button>
                      <Button size="sm" variant="outline">Add Note</Button>
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
