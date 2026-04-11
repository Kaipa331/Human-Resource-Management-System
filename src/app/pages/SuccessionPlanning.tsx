import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Plus, FileText, CircleDollarSign, Users, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

type SuccessionPlan = {
  id: string;
  role: string;
  department: string;
  current_holder: string;
  successor_candidates: string[];
  readiness_level: string;
  status: string;
  notes: string;
  created_at: string;
};

const readinessOptions = ['Emerging', 'Ready', 'Developing', 'Critical'];
const statusOptions = ['Open', 'In Review', 'Ready', 'Closed'];

export function SuccessionPlanning() {
  const [plans, setPlans] = useState<SuccessionPlan[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    role: '',
    department: '',
    currentHolder: '',
    successorCandidates: '',
    readiness: readinessOptions[0],
    status: statusOptions[0],
    notes: '',
  });

  const summary = useMemo(() => {
    const total = plans.length;
    const open = plans.filter((plan) => plan.status === 'Open').length;
    const ready = plans.filter((plan) => plan.readiness_level === 'Ready').length;
    const critical = plans.filter((plan) => plan.readiness_level === 'Critical').length;
    return { total, open, ready, critical };
  }, [plans]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [{ data: planRows, error: planError }, { data: employeeRows, error: empError }] = await Promise.all([
          supabase
            .from('succession_plans')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('employees')
            .select('name')
            .order('name', { ascending: true }),
        ]);

        if (planError) {
          throw planError;
        }
        if (empError) {
          console.error('Unable to load employees for succession planning', empError);
        }

        setPlans((planRows || []).map((plan: any) => ({
          id: plan.id,
          role: plan.role,
          department: plan.department || 'General',
          current_holder: plan.current_holder || 'Unassigned',
          successor_candidates: plan.successor_candidates || [],
          readiness_level: plan.readiness_level || 'Emerging',
          status: plan.status || 'Open',
          notes: plan.notes || '',
          created_at: plan.created_at || '',
        })));

        setEmployees((employeeRows || []).map((emp: any) => emp.name || '')); 
      } catch (error) {
        console.error('Error loading succession planning data', error);
        toast.error('Error loading succession planning data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreatePlan = async () => {
    if (!newPlan.role || !newPlan.department || !newPlan.currentHolder) {
      toast.error('Role, department, and current holder are required.');
      return;
    }

    const successorCandidates = newPlan.successorCandidates
      .split(',')
      .map((candidate) => candidate.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from('succession_plans')
      .insert([{ 
        role: newPlan.role,
        department: newPlan.department,
        current_holder: newPlan.currentHolder,
        successor_candidates: successorCandidates,
        readiness_level: newPlan.readiness,
        status: newPlan.status,
        notes: newPlan.notes,
      }]);

    if (error) {
      console.error('Error creating succession plan', error);
      toast.error('Could not create succession plan');
      return;
    }

    toast.success('Succession plan added successfully');
    setNewPlan({
      role: '',
      department: '',
      currentHolder: '',
      successorCandidates: '',
      readiness: readinessOptions[0],
      status: statusOptions[0],
      notes: '',
    });
    setDialogOpen(false);
    setLoading(true);

    const { data: refreshedPlans, error: refreshError } = await supabase
      .from('succession_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (refreshError) {
      console.error('Error refreshing succession plans', refreshError);
      toast.error('Could not refresh succession plans');
      setLoading(false);
      return;
    }

    setPlans((refreshedPlans || []).map((plan: any) => ({
      id: plan.id,
      role: plan.role,
      department: plan.department || 'General',
      current_holder: plan.current_holder || 'Unassigned',
      successor_candidates: plan.successor_candidates || [],
      readiness_level: plan.readiness_level || 'Emerging',
      status: plan.status || 'Open',
      notes: plan.notes || '',
      created_at: plan.created_at || '',
    })));
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{summary.total}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Succession plans in the pipeline.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{summary.open}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Roles that still require successor alignment.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ready Successors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{summary.ready}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Candidates ready for redeployment.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Critical Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{summary.critical}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Roles that need urgent succession coverage.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Succession Planning</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage high-potential successors and role readiness across the organization.</p>
        </div>
        <div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Succession Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Succession Plan</DialogTitle>
                <DialogDescription>Define role succession, successors, and readiness status.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={newPlan.role}
                    onChange={(event) => setNewPlan({ ...newPlan, role: event.target.value })}
                    placeholder="e.g. Head of Finance"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newPlan.department}
                    onChange={(event) => setNewPlan({ ...newPlan, department: event.target.value })}
                    placeholder="e.g. Finance"
                  />
                </div>
                <div>
                  <Label htmlFor="currentHolder">Current Holder</Label>
                  <Input
                    id="currentHolder"
                    list="succession-employees"
                    value={newPlan.currentHolder}
                    onChange={(event) => setNewPlan({ ...newPlan, currentHolder: event.target.value })}
                    placeholder="Search existing employee"
                  />
                  <datalist id="succession-employees">
                    {employees.map((employee) => (
                      <option key={employee} value={employee} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="successorCandidates">Successor Candidates</Label>
                  <Textarea
                    id="successorCandidates"
                    value={newPlan.successorCandidates}
                    onChange={(event) => setNewPlan({ ...newPlan, successorCandidates: event.target.value })}
                    placeholder="Add candidates separated by commas"
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="readiness">Readiness Level</Label>
                    <Select value={newPlan.readiness} onValueChange={(value) => setNewPlan({ ...newPlan, readiness: value })}>
                      <SelectTrigger id="readiness" className="w-full">
                        <SelectValue placeholder="Select readiness" />
                      </SelectTrigger>
                      <SelectContent>
                        {readinessOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newPlan.status} onValueChange={(value) => setNewPlan({ ...newPlan, status: value })}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newPlan.notes}
                    onChange={(event) => setNewPlan({ ...newPlan, notes: event.target.value })}
                    placeholder="Notes for development plans or performance context"
                    rows={4}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreatePlan}>Save Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Succession Plan Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Loading succession plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No succession plans available yet. Start by creating a new plan.
              </div>
            ) : (
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            <FileText className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold">{plan.role}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{plan.department}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> {plan.current_holder}</span>
                          <span className="inline-flex items-center gap-2"><ArrowUpRight className="h-4 w-4" /> {plan.successor_candidates.join(', ') || 'No candidates assigned'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:items-end">
                        <Badge variant={plan.status === 'Open' ? 'secondary' : plan.status === 'Ready' ? 'default' : 'outline'}>
                          {plan.status}
                        </Badge>
                        <Badge variant={plan.readiness_level === 'Critical' ? 'destructive' : plan.readiness_level === 'Ready' ? 'default' : plan.readiness_level === 'Emerging' ? 'secondary' : 'outline'}>
                          {plan.readiness_level}
                        </Badge>
                      </div>
                    </div>
                    {plan.notes && (
                      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
