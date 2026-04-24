import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Plus, Trash2, Edit, Search, Building, User, Activity, PieChart, Info, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { FormField, FormSection, FormActions } from '../components/ui/form-field';
import { supabase } from '../../lib/supabase';

interface Department {
  id: string;
  name: string;
  head_of_department: string;
  employee_count: number;
  budget_utilization: number;
  status: string;
}

export function Department() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepts, setFilteredDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    head_of_department: '',
    status: 'STABLE',
    budget_utilization: 50,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
      setFilteredDepts(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = departments.filter((dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.head_of_department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepts(filtered);
  }, [searchTerm, departments]);

  const handleCreateDept = async () => {
    if (!formData.name || !formData.head_of_department) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.from('departments').insert([
        {
          name: formData.name,
          head_of_department: formData.head_of_department,
          status: formData.status,
          budget_utilization: formData.budget_utilization,
          employee_count: 0,
        },
      ]);

      if (error) throw error;
      setIsCreateDialogOpen(false);
      setFormData({ name: '', head_of_department: '', status: 'STABLE', budget_utilization: 50 });
      fetchDepartments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error creating department');
    }
  };

  const handleUpdateDept = async () => {
    if (!selectedDept) return;
    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: formData.name,
          head_of_department: formData.head_of_department,
          status: formData.status,
          budget_utilization: formData.budget_utilization,
        })
        .eq('id', selectedDept.id);

      if (error) throw error;
      setIsEditDialogOpen(false);
      fetchDepartments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error updating department');
    }
  };

  const handleDeleteDept = async (deptId: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('departments').delete().eq('id', deptId);
      if (error) throw error;
      fetchDepartments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error deleting department');
    }
  };

  const openEditDialog = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      head_of_department: dept.head_of_department,
      status: dept.status,
      budget_utilization: dept.budget_utilization,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CORE: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      'URGENT HIRE': 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
      STABLE: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
      CREATIVE: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    };
    return colors[status] || 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Structure</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage departmental hierarchy and budgets.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 px-6">
              <Plus className="w-4 h-4 mr-2" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Create Department</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 font-medium">Add a new operational unit to the organization</DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
              <FormSection
                title="Department Identity"
                description="Core details and leadership"
                icon={<Info className="w-4 h-4 text-blue-600" />}
                accentColor="border-blue-500"
              >
                <div className="md:col-span-2">
                  <FormField label="Department Name" required hint="e.g. Engineering, Sales, Human Resources">
                    <input
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter department name"
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <FormField label="Head of Department" required hint="Full name of the department leader">
                    <input
                      value={formData.head_of_department}
                      onChange={e => setFormData({...formData, head_of_department: e.target.value})}
                      placeholder="Enter HOD name"
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </FormField>
                </div>
              </FormSection>

              <FormSection
                title="Resource Planning"
                description="Budget and operational status"
                icon={<PieChart className="w-4 h-4 text-purple-600" />}
                accentColor="border-purple-500"
              >
                <FormField label="Operational Status" required>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                  >
                    <option value="CORE">CORE</option>
                    <option value="URGENT HIRE">URGENT HIRE</option>
                    <option value="STABLE">STABLE</option>
                    <option value="CREATIVE">CREATIVE</option>
                  </select>
                </FormField>
                <FormField label="Budget Utilization %" required hint="Projected resource usage">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.budget_utilization}
                    onChange={(e) => setFormData({ ...formData, budget_utilization: parseInt(e.target.value) })}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                  />
                </FormField>
              </FormSection>
            </div>

            <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <FormActions
                onCancel={() => setIsCreateDialogOpen(false)}
                onSubmit={handleCreateDept}
                submitLabel="Establish Department"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">Loading...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepts.map((dept) => (
            <Card key={dept.id} className="dark:bg-slate-900 dark:border-slate-800 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{dept.name}</h3>
                  <Badge className={getStatusColor(dept.status)}>{dept.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Head: {dept.head_of_department}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Employees</p>
                    <p className="text-2xl font-bold dark:text-white">{dept.employee_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                    <p className="text-2xl font-bold dark:text-white">{dept.budget_utilization}%</p>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500"
                    style={{ width: `${dept.budget_utilization}%` }}
                  ></div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Dialog open={isEditDialogOpen && selectedDept?.id === dept.id} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(dept)}
                        className="flex-1 rounded-xl border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
                      <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Edit className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Edit Department</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500 font-medium">Update departmental details and status</DialogDescription>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
                        <FormSection
                          title="Department Identity"
                          description="Core details and leadership"
                          icon={<Info className="w-4 h-4 text-blue-600" />}
                          accentColor="border-blue-500"
                        >
                          <div className="md:col-span-2">
                            <FormField label="Department Name" required>
                              <input
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                              />
                            </FormField>
                          </div>
                          <div className="md:col-span-2">
                            <FormField label="Head of Department" required>
                              <input
                                value={formData.head_of_department}
                                onChange={e => setFormData({...formData, head_of_department: e.target.value})}
                                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                              />
                            </FormField>
                          </div>
                        </FormSection>

                        <FormSection
                          title="Resource Planning"
                          description="Budget and operational status"
                          icon={<PieChart className="w-4 h-4 text-purple-600" />}
                          accentColor="border-purple-500"
                        >
                          <FormField label="Operational Status" required>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                            >
                              <option value="CORE">CORE</option>
                              <option value="URGENT HIRE">URGENT HIRE</option>
                              <option value="STABLE">STABLE</option>
                              <option value="CREATIVE">CREATIVE</option>
                            </select>
                          </FormField>
                          <FormField label="Budget Utilization %" required>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.budget_utilization}
                              onChange={(e) => setFormData({ ...formData, budget_utilization: parseInt(e.target.value) })}
                              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                            />
                          </FormField>
                        </FormSection>
                      </div>

                      <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                        <FormActions
                          onCancel={() => setIsEditDialogOpen(false)}
                          onSubmit={handleUpdateDept}
                          submitLabel="Update Department"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDept(dept.id)}
                    className="dark:bg-slate-800 text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
