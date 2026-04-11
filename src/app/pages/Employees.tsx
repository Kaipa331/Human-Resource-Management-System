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
import { Search, Plus, Edit, Trash2, Eye, Download, Loader2, Key, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { createEmployeeAccountWithCredentials, resetEmployeePassword } from '../../lib/authService';

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
  role?: string;
}

export function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Account creation dialog
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [newAccountCredentials, setNewAccountCredentials] = useState<{
    email: string;
    tempPassword: string;
    name: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    joinDate: '',
    role: 'Employee',
  });

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

  const filteredEmployees = employees.filter(emp =>
    (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingEmployee(null);
    setFormData({ name: '', email: '', phone: '', department: '', position: '', salary: '', joinDate: '', role: 'Employee' });
    setIsDialogOpen(true);
  };

  const openEditDialog = async (emp: Employee) => {
    let role = 'Employee';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('employee_id', emp.id)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role;
      }
    } catch (error) {
      console.error('Error loading employee role for edit:', error);
    }

    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || '',
      position: emp.position || '',
      salary: emp.salary ? String(emp.salary) : '',
      joinDate: emp.join_date || '',
      role,
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = async (emp: Employee) => {
    let role = emp.role || 'Employee';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('employee_id', emp.id)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role;
      }
    } catch (error) {
      console.error('Error loading profile role for view dialog:', error);
    }

    setViewingEmployee({ ...emp, role });
    setIsViewDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.department) {
      toast.error('Please fill in required fields (Name, Email, Dept)');
      return;
    }

    const normalizedEmail = formData.email.toLowerCase().trim();

    try {
      const parsedSalary = typeof formData.salary === 'string' ? parseFloat(formData.salary.replace(/[^\d.]/g, '')) || 0 : formData.salary;
      const joinStr = formData.joinDate || new Date().toISOString().split('T')[0];

      if (editingEmployee) {
        // Updating existing employee - no new account creation
        const { error } = await supabase
          .from('employees')
          .update({
            name: formData.name,
            email: normalizedEmail,
            phone: formData.phone,
            department: formData.department,
            position: formData.position,
            join_date: joinStr,
            salary: parsedSalary
          })
          .eq('id', editingEmployee.id);
        if (error) throw error;

        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            email: normalizedEmail,
            role: formData.role,
          })
          .eq('employee_id', editingEmployee.id);

        if (profileUpdateError) {
          console.error('Failed to update profile email/role after employee edit:', profileUpdateError);
        }

        toast.success('Employee updated successfully');
      } else {
        // Adding new employee - create account AND employee record
        const empId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
        const normalizedEmail = formData.email.toLowerCase().trim();
        
        // Step 1: Create Supabase Auth account and profile
        const accountResult = await createEmployeeAccountWithCredentials(
          normalizedEmail,
          formData.name,
          formData.role || 'Employee'
        );

        if (!accountResult.success) {
          // Account creation failed - don't create employee record
          toast.error(`Failed to create account: ${accountResult.error}`);
          return;
        }

        // Step 2: Create employee record in database
        const { data: insertedEmployee, error: empError } = await supabase
          .from('employees')
          .insert([{
            name: formData.name,
            email: normalizedEmail,
            phone: formData.phone,
            department: formData.department,
            position: formData.position,
            join_date: joinStr,
            employee_id: empId,
            status: 'Active',
            salary: parsedSalary
          }])
          .select('id')
          .single();
        
        if (empError || !insertedEmployee?.id) {
          toast.error('Failed to create employee record: ' + (empError?.message || 'Unknown error'));
          return;
        }

        if (accountResult.userId) {
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ employee_id: insertedEmployee.id })
            .eq('email', normalizedEmail);

          if (profileUpdateError) {
            console.error('Failed to attach employee record to profile:', profileUpdateError);
          }
        }

        // Show credentials dialog
        setNewAccountCredentials({
          email: normalizedEmail,
          tempPassword: accountResult.tempPassword || '',
          name: formData.name,
        });
        setIsCredentialsDialogOpen(true);
        toast.success('Employee account created successfully!');
      }

      setIsDialogOpen(false);
      fetchEmployees();
    } catch (error: any) {
      toast.error(`Error ${editingEmployee ? 'updating' : 'adding'} employee: ` + error.message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      toast.success('Employee removed');
      fetchEmployees();
    } catch (error: any) {
      toast.error('Error deleting employee: ' + error.message);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const result = await resetEmployeePassword(email);
      if (result.success) {
        toast.success(`Password reset email sent to ${email}`);
      } else {
        toast.error(result.error || 'Failed to send password reset email');
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleExport = () => {
    if (employees.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Position', 'Status'];
    const rows = filteredEmployees.map(emp => [
      emp.employee_id,
      emp.name,
      emp.email,
      emp.department,
      emp.position,
      emp.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "employees_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export downloaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage employee records and information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              <DialogDescription>{editingEmployee ? 'Update employee details' : 'Enter employee details to add them to the system'}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Precious Kaipa" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@company.com" disabled={!!editingEmployee} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+265 991 234 567" />
              </div>
              <div>
                <Label>Department *</Label>
                <Select value={formData.department} onValueChange={(val) => setFormData({ ...formData, department: val })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
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
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="Software Engineer" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Salary</Label>
                <Input value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} placeholder="MWK 850,000" />
              </div>
              <div className="col-span-2">
                <Label>Join Date</Label>
                <Input type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingEmployee ? 'Update Employee' : 'Add Employee'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>Full profile information</DialogDescription>
            </DialogHeader>
            {viewingEmployee && (
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div>
                    <h3 className="text-lg font-bold">{viewingEmployee.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{viewingEmployee.employee_id}</p>
                  </div>
                  <Badge variant={viewingEmployee.status === 'Active' ? 'default' : 'secondary'}>
                    {viewingEmployee.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-y-4 text-sm mt-4">
                  <div>
                    <p className="text-gray-500">Email Address</p>
                    <p className="font-medium">{viewingEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{viewingEmployee.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Department</p>
                    <p className="font-medium">{viewingEmployee.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Role</p>
                    <p className="font-medium">{viewingEmployee.role || 'Employee'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Position</p>
                    <p className="font-medium">{viewingEmployee.position}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Join Date</p>
                    <p className="font-medium">{viewingEmployee.join_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Salary</p>
                    <p className="font-medium">MWK {Number(viewingEmployee.salary || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
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
                <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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
                          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{employee.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{employee.department}</TableCell>
                      <TableCell className="hidden lg:table-cell">{employee.position}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{employee.phone}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] md:text-xs">{employee.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openViewDialog(employee)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(employee)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-blue-600"
                            onClick={() => handleResetPassword(employee.email)}
                            title="Send password reset email"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteEmployee(employee.id)}>
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

      {/* New Account Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Account Created Successfully
            </DialogTitle>
            <DialogDescription>
              Share these credentials with {newAccountCredentials?.name}
            </DialogDescription>
          </DialogHeader>
          
          {newAccountCredentials && (
            <div className="space-y-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Email Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-white px-3 py-2 rounded border flex-1">
                      {newAccountCredentials.email}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(newAccountCredentials.email);
                        toast.success('Email copied!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-white px-3 py-2 rounded border flex-1 break-all">
                      {newAccountCredentials.tempPassword}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(newAccountCredentials.tempPassword);
                        toast.success('Password copied!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800">
                <p className="font-medium mb-1">⚠️ Important:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Send these credentials to the employee securely (not via email)</li>
                  <li>Employee must change password on first login</li>
                  <li>Password expires after first use</li>
                  <li>Keep this dialog open while you share the details</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Next Steps:</strong></p>
                <ol className="text-sm space-y-1 list-decimal pl-5">
                  <li>Share credentials with the employee</li>
                  <li>Employee logs in at <code className="bg-gray-100 px-2 py-1 rounded text-xs">{window.location.origin}/login</code></li>
                  <li>Employee creates a new password on first login</li>
                </ol>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsCredentialsDialogOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
