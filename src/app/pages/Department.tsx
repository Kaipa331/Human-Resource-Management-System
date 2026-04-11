import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Trash2, Edit, Search } from 'lucide-react';
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
      alert('Please fill in all fields');
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
      alert('Error creating department');
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
      alert('Error updating department');
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
      alert('Error deleting department');
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
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Create Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Department Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="dark:bg-slate-800 dark:text-white"
              />
              <Input
                placeholder="Head of Department"
                value={formData.head_of_department}
                onChange={(e) => setFormData({ ...formData, head_of_department: e.target.value })}
                className="dark:bg-slate-800 dark:text-white"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-700"
              >
                <option value="CORE">CORE</option>
                <option value="URGENT HIRE">URGENT HIRE</option>
                <option value="STABLE">STABLE</option>
                <option value="CREATIVE">CREATIVE</option>
              </select>
              <Input
                type="number"
                placeholder="Budget Utilization %"
                min="0"
                max="100"
                value={formData.budget_utilization}
                onChange={(e) => setFormData({ ...formData, budget_utilization: parseInt(e.target.value) })}
                className="dark:bg-slate-800 dark:text-white"
              />
              <Button onClick={handleCreateDept} className="w-full bg-blue-600">Create</Button>
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
                        className="flex-1 dark:bg-slate-800"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:bg-slate-900">
                      <DialogHeader>
                        <DialogTitle className="dark:text-white">Edit Department</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="dark:bg-slate-800 dark:text-white" />
                        <Input value={formData.head_of_department} onChange={(e) => setFormData({ ...formData, head_of_department: e.target.value })} className="dark:bg-slate-800 dark:text-white" />
                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-700">
                          <option value="CORE">CORE</option>
                          <option value="URGENT HIRE">URGENT HIRE</option>
                          <option value="STABLE">STABLE</option>
                          <option value="CREATIVE">CREATIVE</option>
                        </select>
                        <Input type="number" min="0" max="100" value={formData.budget_utilization} onChange={(e) => setFormData({ ...formData, budget_utilization: parseInt(e.target.value) })} className="dark:bg-slate-800 dark:text-white" />
                        <Button onClick={handleUpdateDept} className="w-full bg-blue-600">Update</Button>
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
