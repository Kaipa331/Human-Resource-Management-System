import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Plus, FileText, CircleDollarSign, Users, ArrowUpRight, X, Download, Trash2, Pencil, Briefcase, Award, TrendingUp, ShieldAlert, ListChecks } from 'lucide-react';
import { FormField, FormSection, FormActions } from '../components/ui/form-field';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

type SuccessorDetail = {
  id?: string;
  level: string; // '1st', '2nd', '3rd'
  availability: string;
  plan_type: string;
  successor_position: string;
  successor_name: string;
  grade: string;
  matrix_placement: string;
  personality: string;
  years_in_service: number;
  years_in_current_role: number;
  readiness: string;
  development_plan: string;
  development_tracker: string;
};

type SuccessionPlan = {
  id: string;
  role: string;
  department: string;
  current_holder: string;
  incumbent_grade: string;
  risk_of_losing: string;
  successor_candidates: string[];
  readiness_level: string;
  status: string;
  notes: string;
  created_at: string;
  successors?: SuccessorDetail[];
};

type Employee = {
  id: string;
  name: string;
  department: string;
  position: string;
  join_date: string;
};

const statusOptions = ['Open', 'In Review', 'Ready', 'Closed'];
const riskOptions = ['High', 'Medium', 'Low'];
const planTypeOptions = ['Internal', 'External'];
const availabilityOptions = ['Yes', 'No'];
const matrixOptions = ['Key Contributor', 'Professional Star', 'High Potential', 'Core Player', 'Developing'];
const readinessTimeOptions = ['<12 Months', '12-24 Months', '24-36 Months', '>36 Months'];

export function SuccessionPlanning() {
  const [plans, setPlans] = useState<SuccessionPlan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const initialSuccessor = (level: string) => ({
    level,
    availability: 'No',
    plan_type: 'Internal',
    successor_position: '',
    successor_name: '',
    grade: '',
    matrix_placement: 'Core Player',
    personality: '',
    years_in_service: 0,
    years_in_current_role: 0,
    readiness: '12-24 Months',
    development_plan: '',
    development_tracker: '',
  });

  const [newPlan, setNewPlan] = useState({
    id: undefined as string | undefined,
    role: '',
    department: '',
    currentHolder: '',
    incumbentGrade: '',
    riskOfLosing: 'Medium',
    status: statusOptions[0],
    notes: '',
    successors: [
      initialSuccessor('1st'),
      initialSuccessor('2nd'),
      initialSuccessor('3rd'),
    ]
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
            .select('*, successors:successor_details(*)')
            .order('created_at', { ascending: false }),
          supabase
            .from('employees')
            .select('id, name, department, position, join_date')
            .order('name', { ascending: true }),
        ]);

        if (planError) {
          throw planError;
        }
        if (empError) {
          console.error('Unable to load employees for succession planning', empError);
        }

        const employeeList = (employeeRows || []).map((emp: any) => ({
          id: emp.id,
          name: emp.name || 'Unknown',
          department: emp.department || 'General',
          position: emp.position || '',
          join_date: emp.join_date || '',
        }));

        setEmployees(employeeList);
        
        // Extract unique departments
        const uniqueDepartments = Array.from(new Set(employeeList.map(e => e.department))).sort();
        setDepartments(uniqueDepartments);

        setPlans((planRows || []).map((plan: any) => ({
          id: plan.id,
          role: plan.role,
          department: plan.department || 'General',
          current_holder: plan.current_holder || 'Unassigned',
          incumbent_grade: plan.incumbent_grade || '',
          risk_of_losing: plan.risk_of_losing || 'Low',
          successor_candidates: plan.successor_candidates || [],
          readiness_level: plan.readiness_level || 'Emerging',
          status: plan.status || 'Open',
          notes: plan.notes || '',
          created_at: plan.created_at || '',
          successors: plan.successors || [],
        })));
      } catch (error) {
        console.error('Error loading succession planning data', error);
        toast.error('Error loading succession planning data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDownloadCSV = () => {
    const headers = [
      'No.', 'Role', 'Department', 'Incumbent', 'Incumbent Grade', 'Risk of Losing',
      'Level', 'Availability', 'Plan Type', 'Successor Position', 'Successor Name',
      'Successor Grade', 'Matrix Placement', 'Personality', 'Years Service', 'Years Role', 'Readiness', 'Development Plan'
    ].join(',');

    const rows = plans.flatMap((plan, pIdx) => {
      const successors = plan.successors && plan.successors.length > 0 
        ? plan.successors 
        : [null];

      return successors.map(succ => {
        return [
          pIdx + 1,
          `"${plan.role}"`,
          `"${plan.department}"`,
          `"${plan.current_holder}"`,
          `"${plan.incumbent_grade}"`,
          `"${plan.risk_of_losing}"`,
          `"${succ?.level || ''}"`,
          `"${succ?.availability || ''}"`,
          `"${succ?.plan_type || ''}"`,
          `"${succ?.successor_position || ''}"`,
          `"${succ?.successor_name || ''}"`,
          `"${succ?.grade || ''}"`,
          `"${succ?.matrix_placement || ''}"`,
          `"${succ?.personality || ''}"`,
          succ?.years_in_service || 0,
          succ?.years_in_current_role || 0,
          `"${succ?.readiness || ''}"`,
          `"${succ?.development_plan || ''}"`
        ].join(',');
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "succession_matrix.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditOpen = (plan: SuccessionPlan) => {
    // Fill form with 3 slots, mapping existing data where available
    const successors = [1, 2, 3].map(i => {
      const level = i === 1 ? '1st' : i === 2 ? '2nd' : '3rd';
      const existing = plan.successors?.find(s => s.level === level);
      return existing || initialSuccessor(level);
    });

    setNewPlan({
      id: plan.id,
      role: plan.role,
      department: plan.department,
      currentHolder: plan.current_holder,
      incumbentGrade: plan.incumbent_grade,
      riskOfLosing: plan.risk_of_losing,
      status: plan.status,
      notes: plan.notes,
      successors
    });
    setIsDialogOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this succession plan? This will also remove all candidate details.')) return;
    
    try {
      const { error } = await supabase.from('succession_plans').delete().eq('id', id);
      if (error) throw error;
      toast.success('Record deleted');
      setPlans(plans.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.role || !newPlan.department || !newPlan.currentHolder) {
      toast.error('Role, department, and current holder are required.');
      return;
    }

    try {
      let planId = newPlan.id;

      if (planId) {
        // Update existing
        const { error: planError } = await supabase
          .from('succession_plans')
          .update({ 
            role: newPlan.role,
            department: newPlan.department,
            current_holder: newPlan.currentHolder,
            incumbent_grade: newPlan.incumbentGrade,
            risk_of_losing: newPlan.riskOfLosing,
            status: newPlan.status,
            notes: newPlan.notes,
          })
          .eq('id', planId);
        if (planError) throw planError;

        // Clear existing successors for this plan and re-insert
        await supabase.from('successor_details').delete().eq('plan_id', planId);
      } else {
        // Create main plan
        const { data: planData, error: planError } = await supabase
          .from('succession_plans')
          .insert([{ 
            role: newPlan.role,
            department: newPlan.department,
            current_holder: newPlan.currentHolder,
            incumbent_grade: newPlan.incumbentGrade,
            risk_of_losing: newPlan.riskOfLosing,
            status: newPlan.status,
            notes: newPlan.notes,
          }])
          .select()
          .single();

        if (planError) throw planError;
        planId = planData.id;
      }

      // 2. Insert successor details
      const successorItems = newPlan.successors
        .filter(s => s.successor_name)
        .map(s => ({
          plan_id: planId,
          ...s
        }));

      if (successorItems.length > 0) {
        const { error: succError } = await supabase
          .from('successor_details')
          .insert(successorItems);
        if (succError) throw succError;
      }

      toast.success(newPlan.id ? 'Talent Matrix updated' : 'Talent Matrix created');
      setIsDialogOpen(false);
      
      // Cleanup & Refresh
      setNewPlan({
        id: undefined,
        role: '',
        department: '',
        currentHolder: '',
        incumbentGrade: '',
        riskOfLosing: 'Medium',
        status: statusOptions[0],
        notes: '',
        successors: [initialSuccessor('1st'), initialSuccessor('2nd'), initialSuccessor('3rd')]
      });

      // Refresh Data
      const { data: refreshedPlans } = await supabase
        .from('succession_plans')
        .select('*, successors:successor_details(*)')
        .order('created_at', { ascending: false });

      setPlans(refreshedPlans.map((plan: any) => ({
        id: plan.id,
        role: plan.role,
        department: plan.department,
        current_holder: plan.current_holder,
        incumbent_grade: plan.incumbent_grade,
        risk_of_losing: plan.risk_of_losing,
        status: plan.status,
        notes: plan.notes,
        created_at: plan.created_at,
        successors: plan.successors,
      })));

    } catch (error: any) {
      console.error('Error creating talent matrix record', error);
      toast.error('Error: ' + error.message);
    }
  };

  const handleUpdateSuccessorField = (index: number, field: keyof SuccessorDetail, value: any) => {
    const updatedSuccessors = [...newPlan.successors];
    updatedSuccessors[index] = { ...updatedSuccessors[index], [field]: value };
    
    // Auto-fill details if internal employee selected
    if (field === 'successor_name') {
      const emp = employees.find(e => e.name === value);
      if (emp) {
        updatedSuccessors[index].successor_position = emp.position;
        // Simple year calculation
        if (emp.join_date) {
            const years = new Date().getFullYear() - new Date(emp.join_date).getFullYear();
            updatedSuccessors[index].years_in_service = years > 0 ? years : 0;
        }
      }
    }

    setNewPlan({ ...newPlan, successors: updatedSuccessors });
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
          <h2 className="text-2xl font-bold uppercase">Succession Planning & Talent Matrix</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Strategic talent assessment and successor readiness tracker.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadCSV} className="inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Matrix
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setNewPlan({
              id: undefined,
              role: '',
              department: '',
              currentHolder: '',
              incumbentGrade: '',
              riskOfLosing: 'Medium',
              status: statusOptions[0],
              notes: '',
              successors: [initialSuccessor('1st'), initialSuccessor('2nd'), initialSuccessor('3rd')]
            });
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 px-6">
                <Plus className="w-4 h-4 mr-2" />
                Add New Succession Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">{newPlan.id ? 'Edit Talent Matrix' : 'Talent Matrix Assessment'}</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 font-medium">Map your organization's future leadership pipeline</DialogDescription>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
                <FormSection
                  title="Position & Incumbent"
                  description="Core details for the role being assessed"
                  icon={<Briefcase className="w-4 h-4 text-emerald-600" />}
                  accentColor="border-emerald-500"
                >
                  <FormField label="Target Position" required hint="The role requiring a succession plan">
                    <input 
                      value={newPlan.role} 
                      onChange={e => setNewPlan({...newPlan, role: e.target.value})} 
                      placeholder="e.g. Chief Technical Officer" 
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                    />
                  </FormField>
                  <FormField label="Department" required>
                    <Select value={newPlan.department} onValueChange={v => setNewPlan({...newPlan, department: v})}>
                      <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select dept" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Current Incumbent">
                    <Select value={newPlan.currentHolder} onValueChange={v => setNewPlan({...newPlan, currentHolder: v})}>
                      <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Current Grade">
                    <input 
                      value={newPlan.incumbentGrade} 
                      onChange={e => setNewPlan({...newPlan, incumbentGrade: e.target.value})} 
                      placeholder="e.g. 7" 
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                    />
                  </FormField>
                  <FormField label="Risk of Losing">
                    <Select value={newPlan.riskOfLosing} onValueChange={v => setNewPlan({...newPlan, riskOfLosing: v})}>
                      <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {riskOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Status">
                     <Select value={newPlan.status} onValueChange={v => setNewPlan({...newPlan, status: v})}>
                        <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                  </FormField>
                </FormSection>

                <FormSection
                   title="Potential Successors"
                   description="Evaluation of candidates across 3 levels"
                   icon={<Users className="w-4 h-4 text-blue-600" />}
                   accentColor="border-blue-500"
                >
                  <div className="md:col-span-2 space-y-4">
                    {newPlan.successors.map((succ, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {idx + 1}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{succ.level} Level Candidate</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField label="Successor Name">
                            <Select value={succ.successor_name} onValueChange={v => handleUpdateSuccessorField(idx, 'successor_name', v)}>
                              <SelectTrigger className="rounded-xl border border-slate-200 dark:border-slate-700 h-10"><SelectValue placeholder="Pick candidate" /></SelectTrigger>
                              <SelectContent>
                                {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name} ({e.department})</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Availability">
                            <Select value={succ.availability} onValueChange={v => handleUpdateSuccessorField(idx, 'availability', v)}>
                              <SelectTrigger className="rounded-xl border border-slate-200 dark:border-slate-700 h-10"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {availabilityOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Grade">
                            <input value={succ.grade || ''} onChange={e => handleUpdateSuccessorField(idx, 'grade', e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none" />
                          </FormField>
                          <FormField label="Matrix Placement">
                            <Select value={succ.matrix_placement} onValueChange={v => handleUpdateSuccessorField(idx, 'matrix_placement', v)}>
                              <SelectTrigger className="rounded-xl border border-slate-200 dark:border-slate-700 h-10"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {matrixOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Timeframe">
                            <Select value={succ.readiness} onValueChange={v => handleUpdateSuccessorField(idx, 'readiness', v)}>
                              <SelectTrigger className="rounded-xl border border-slate-200 dark:border-slate-700 h-10"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {readinessTimeOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Personality">
                            <input value={succ.personality || ''} onChange={e => handleUpdateSuccessorField(idx, 'personality', e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none" placeholder="e.g. Driver" />
                          </FormField>
                          <div className="md:col-span-3">
                            <FormField label="Development Initiatives">
                              <input value={succ.development_plan || ''} onChange={e => handleUpdateSuccessorField(idx, 'development_plan', e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none" placeholder="Mentorship, Training..." />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </FormSection>
              </div>

              <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                <FormActions
                  onCancel={() => setIsDialogOpen(false)}
                  onSubmit={handleCreatePlan}
                  submitLabel="Commit Talent Matrix"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50 uppercase font-black tracking-tight text-slate-800 dark:text-slate-100 text-[10px]">
                <th rowSpan={2} className="border-r border-b p-3 text-center w-12">Actions</th>
                <th rowSpan={2} className="border-r border-b p-3 text-center w-10">No.</th>
                <th rowSpan={2} className="border-r border-b p-3 text-left min-w-[200px] bg-slate-200/50 dark:bg-emerald-900/10">Position</th>
                <th rowSpan={2} className="border-r border-b p-3 text-left min-w-[150px] bg-slate-200/50 dark:bg-emerald-900/10">Current Incumbent</th>
                <th rowSpan={2} className="border-r border-b p-3 text-center w-16 bg-slate-200/50 dark:bg-emerald-900/10">Grade</th>
                <th rowSpan={2} className="border-r border-b p-3 text-center w-20 bg-emerald-100 dark:bg-emerald-900/30">Risk of Losing</th>
                <th colSpan={3} className="border-r border-b p-2 text-center bg-emerald-50 dark:bg-emerald-900/20">Planning Details</th>
                <th rowSpan={2} className="border-r border-b p-3 text-left min-w-[180px] bg-orange-50 dark:bg-orange-900/10">Successor Position</th>
                <th rowSpan={2} className="border-r border-b p-3 text-left min-w-[180px] bg-orange-50 dark:bg-orange-900/10">Current Successor Name</th>
                <th rowSpan={2} className="border-r border-b p-3 text-center w-16 bg-orange-50 dark:bg-orange-900/10">Grade</th>
                <th rowSpan={2} className="border-r border-b p-3 text-left min-w-[150px] bg-orange-50 dark:bg-orange-900/10">Matrix Placement</th>
                <th rowSpan={2} className="border-r border-b p-3 text-left min-w-[120px] bg-orange-50 dark:bg-orange-900/10">Personality</th>
                <th rowSpan={2} className="border-r border-b p-3 text-center w-16 bg-orange-50 dark:bg-orange-900/10">Years Service</th>
                <th rowSpan={2} className="border-r border-b p-3 text-center w-16 bg-orange-50 dark:bg-orange-900/10">Years Role</th>
                <th rowSpan={2} className="border-r border-b p-3 text-center w-24 bg-yellow-50 dark:bg-yellow-900/10">Readiness</th>
                <th rowSpan={2} className="border-r border-b p-3 text-left min-w-[250px] bg-yellow-50 dark:bg-yellow-900/10 text-emerald-800">Development Plan</th>
              </tr>
              <tr className="bg-slate-100 dark:bg-slate-800/50 uppercase font-black text-[10px]">
                <th className="border-r border-b p-2 text-center w-16 bg-slate-50 dark:bg-slate-900">Level</th>
                <th className="border-r border-b p-2 text-center w-20 bg-slate-50 dark:bg-slate-900">Availability</th>
                <th className="border-r border-b p-2 text-center w-16 bg-slate-50 dark:bg-slate-900">Plan</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={17} className="p-12 text-center text-slate-400 italic">No talent matrix records found.</td>
                </tr>
              ) : (
                plans.map((plan, pIdx) => {
                  const successorCount = plan.successors?.length || 1;
                  return (
                    <>
                      {(plan.successors && plan.successors.length > 0 ? plan.successors : [null]).map((succ, sIdx) => (
                        <tr key={`${plan.id}-${sIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          {sIdx === 0 && (
                            <>
                              <td rowSpan={successorCount} className="border-r border-b p-3 text-center">
                                <div className="flex flex-col gap-2 items-center">
                                  <button onClick={() => handleEditOpen(plan)} title="Edit Plan" className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50">
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => handleDeletePlan(plan.id)} title="Delete Plan" className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              <td rowSpan={successorCount} className="border-r border-b p-3 text-center font-bold">{pIdx + 1}</td>
                              <td rowSpan={successorCount} className="border-r border-b p-3 font-black text-slate-900 dark:text-white uppercase">{plan.role}</td>
                              <td rowSpan={successorCount} className="border-r border-b p-3">{plan.current_holder}</td>
                              <td rowSpan={successorCount} className="border-r border-b p-3 text-center font-mono">{plan.incumbent_grade}</td>
                              <td rowSpan={successorCount} className="border-r border-b p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  plan.risk_of_losing === 'High' ? 'bg-red-100 text-red-700' : 
                                  plan.risk_of_losing === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {plan.risk_of_losing}
                                </span>
                              </td>
                            </>
                          )}
                          <td className="border-r border-b p-3 text-center font-black bg-slate-50/50 dark:bg-slate-800/20">{succ?.level || '-'}</td>
                          <td className="border-r border-b p-3 text-center">{succ?.availability || '-'}</td>
                          <td className="border-r border-b p-3 text-center">{succ?.plan_type || '-'}</td>
                          <td className="border-r border-b p-3">{succ?.successor_position || '-'}</td>
                          <td className="border-r border-b p-3 font-semibold text-emerald-700 dark:text-emerald-400">{succ?.successor_name || 'N/A'}</td>
                          <td className="border-r border-b p-3 text-center font-mono">{succ?.grade || '-'}</td>
                          <td className="border-r border-b p-3 italic text-slate-500">{succ?.matrix_placement || '-'}</td>
                          <td className="border-r border-b p-3">{succ?.personality || '-'}</td>
                          <td className="border-r border-b p-3 text-center">{succ?.years_in_service || '0'}</td>
                          <td className="border-r border-b p-3 text-center">{succ?.years_in_current_role || '0'}</td>
                          <td className="border-r border-b p-3 text-center font-bold text-orange-600">{succ?.readiness || '-'}</td>
                          <td className="border-r border-b p-3 leading-4 text-slate-600 dark:text-slate-300">{succ?.development_plan || '-'}</td>
                        </tr>
                      ))}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
}
