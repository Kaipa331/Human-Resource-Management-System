import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Plus, Edit, Trash2, Eye, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: string;
  join_date: string;
  salary: number | string;
}

export function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('employee_id', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast.error('Error fetching employees: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    joinDate: '',
  });

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const empId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
      const { error } = await supabase
        .from('employees')
        .insert([{
          name: newEmployee.name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          department: newEmployee.department,
          position: newEmployee.position,
          join_date: newEmployee.joinDate || new Date().toISOString().split('T')[0],
          employee_id: empId,
          status: 'Active',
          salary: typeof newEmployee.salary === 'string' ? parseFloat(newEmployee.salary.replace(/[^\d.]/g, '')) : newEmployee.salary
        }]);

      if (error) throw error;

      toast.success('Employee added successfully');
      setIsDialogOpen(false);
      setNewEmployee({ name: '', email: '', phone: '', department: '', position: '', salary: '', joinDate: '' });
      fetchEmployees();
    } catch (error: any) {
      toast.error('Error adding employee: ' + error.message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Employee removed');
      fetchEmployees();
    } catch (error: any) {
      toast.error('Error deleting employee: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 mt-1">Manage employee records and information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Enter employee details to add them to the system</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Precious Kaipa"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="+265 991 234 567"
                />
              </div>
              <div>
                <Label>Department *</Label>
                <Select value={newEmployee.department} onValueChange={(val) => setNewEmployee({ ...newEmployee, department: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Position</Label>
                <Input
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
              <div>
                <Label>Salary</Label>
                <Input
                  value={newEmployee.salary}
                  onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                  placeholder="MWK 850,000"
                />
              </div>
              <div className="col-span-2">
                <Label>Join Date</Label>
                <Input
                  type="date"
                  value={newEmployee.joinDate}
                  onChange={(e) => setNewEmployee({ ...newEmployee, joinDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddEmployee}>Add Employee</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Employees ({employees.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden lg:table-cell">Position</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employee_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm md:text-base">{employee.name}</p>
                          <p className="text-xs md:text-sm text-gray-500">{employee.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{employee.department}</TableCell>
                      <TableCell className="hidden lg:table-cell">{employee.position}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{employee.phone}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] md:text-xs">
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
