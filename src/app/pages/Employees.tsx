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
import { Search, Plus, Edit, Trash2, Eye, Download, X, Loader2, Key, CheckCircle, Copy, User, Briefcase, Phone, CreditCard, Calendar, MapPin, Activity, Building2 } from 'lucide-react';
import { FormField, FormSection, FormActions } from '../components/ui/form-field';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { createEmployeeAccountWithCredentials, resetEmployeePassword } from '../../lib/authService';
import Loader from '../components/ui/Loader';

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
  // 🔹 Identity & Basics
  date_of_birth: string;
  gender: string;
  address: string;
  // 🔹 Employment Info
  employment_type: string;
  manager_supervisor: string;
  work_location: string;
  // 🔹 Emergency Info
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  // 🔹 Payroll Basics
  bank_name: string;
  bank_account_number: string;
  tax_id_pin: string;
}

export function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
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
    // 🔹 Identity & Basics
    dateOfBirth: '',
    gender: '',
    address: '',
    // 🔹 Employment Info
    employmentType: '',
    managerSupervisor: '',
    workLocation: '',
    // 🔹 Emergency Info
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    // 🔹 Payroll Basics
    bankName: '',
    bankAccountNumber: '',
    taxIdPin: '',
  } as {
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    salary: string;
    joinDate: string;
    role: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    employmentType: string;
    managerSupervisor: string;
    workLocation: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    bankName: string;
    bankAccountNumber: string;
    taxIdPin: string;
  });

  useEffect(() => {
    fetchEmployees();
  }, [refreshKey]);

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
    setFormData({ 
      name: '', email: '', phone: '', department: '', position: '', salary: '', joinDate: '', role: 'Employee',
      dateOfBirth: '', gender: '', address: '',
      employmentType: '', managerSupervisor: '', workLocation: '',
      emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '',
      bankName: '', bankAccountNumber: '', taxIdPin: ''
    });
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
      salary: String(emp.salary || ''),
      joinDate: emp.join_date || '',
      role: role,
      dateOfBirth: emp.date_of_birth || '',
      gender: emp.gender || '',
      address: emp.address || '',
      employmentType: emp.employment_type || '',
      managerSupervisor: emp.manager_supervisor || '',
      workLocation: emp.work_location || '',
      emergencyContactName: emp.emergency_contact_name || '',
      emergencyContactPhone: emp.emergency_contact_phone || '',
      emergencyContactRelationship: emp.emergency_contact_relationship || '',
      bankName: emp.bank_name || '',
      bankAccountNumber: emp.bank_account_number || '',
      taxIdPin: emp.tax_id_pin || '',
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
    console.log('🔍 DEBUG: Starting employee creation with data:', {
      name: formData.name,
      email: normalizedEmail,
      department: formData.department,
      position: formData.position,
      salary: formData.salary,
      role: formData.role
    });

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
            salary: parsedSalary,
            join_date: joinStr,
            // Only include additional fields if they exist in database
            ...(formData.dateOfBirth && { date_of_birth: formData.dateOfBirth }),
            ...(formData.gender && { gender: formData.gender }),
            ...(formData.address && { address: formData.address }),
            ...(formData.employmentType && { employment_type: formData.employmentType }),
            ...(formData.managerSupervisor && { manager_supervisor: formData.managerSupervisor }),
            ...(formData.workLocation && { work_location: formData.workLocation }),
            ...(formData.emergencyContactName && { emergency_contact_name: formData.emergencyContactName }),
            ...(formData.emergencyContactPhone && { emergency_contact_phone: formData.emergencyContactPhone }),
            ...(formData.emergencyContactRelationship && { emergency_contact_relationship: formData.emergencyContactRelationship }),
            ...(formData.bankName && { bank_name: formData.bankName }),
            ...(formData.bankAccountNumber && { bank_account_number: formData.bankAccountNumber }),
            ...(formData.taxIdPin && { tax_id_pin: formData.taxIdPin }),
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
        const empId = `EMP${Date.now()}`;
        const normalizedEmail = formData.email.toLowerCase().trim();
        
        // Fix 1: Check for duplicate email before proceeding
        console.log('🔍 DEBUG: Checking for duplicate email:', normalizedEmail);
        const { data: existingEmployee } = await supabase
          .from('employees')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (existingEmployee) {
          console.error('❌ Employee with this email already exists:', normalizedEmail);
          toast.error('Employee with this email already exists');
          return;
        }
        
        // Step 1: Create Supabase Auth account and profile
        console.log('🔍 DEBUG: Creating account for:', normalizedEmail);
        const accountResult = await createEmployeeAccountWithCredentials(
          normalizedEmail,
          formData.name,
          formData.role || 'Employee'
        );

        console.log('🔍 DEBUG: Account creation result:', accountResult);

        if (!accountResult.success) {
          // Account creation failed - don't create employee record
          console.error('❌ Account creation failed:', accountResult.error);
          toast.error(`Failed to create account: ${accountResult.error}`);
          return;
        }

        // Fix 2: Clean enum values and validate
        const cleanGender = formData.gender?.trim();
        const cleanEmploymentType = formData.employmentType?.trim();
        
        // Fix 3: Debug log exact values being sent
        console.log('🚨 VALUES BEING SENT:', {
          gender: formData.gender,
          employmentType: formData.employmentType,
          cleanGender: cleanGender,
          cleanEmploymentType: cleanEmploymentType
        });

        // Step 2: Create employee record in database
        console.log('🔍 DEBUG: Inserting employee record with data:', {
          name: formData.name,
          email: normalizedEmail,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
          join_date: joinStr,
          employee_id: empId,
          status: 'Active',
          salary: parsedSalary
        });

        // Only insert basic fields that definitely exist in database
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
            salary: parsedSalary,
            // Only include additional fields if they exist in database (with cleaned values)
            ...(formData.dateOfBirth && { date_of_birth: formData.dateOfBirth }),
            ...(cleanGender && { gender: cleanGender }),
            ...(formData.address && { address: formData.address }),
            ...(cleanEmploymentType && { employment_type: cleanEmploymentType }),
            ...(formData.managerSupervisor && { manager_supervisor: formData.managerSupervisor }),
            ...(formData.workLocation && { work_location: formData.workLocation }),
            ...(formData.emergencyContactName && { emergency_contact_name: formData.emergencyContactName }),
            ...(formData.emergencyContactPhone && { emergency_contact_phone: formData.emergencyContactPhone }),
            ...(formData.emergencyContactRelationship && { emergency_contact_relationship: formData.emergencyContactRelationship }),
            ...(formData.bankName && { bank_name: formData.bankName }),
            ...(formData.bankAccountNumber && { bank_account_number: formData.bankAccountNumber }),
            ...(formData.taxIdPin && { tax_id_pin: formData.taxIdPin }),
          }])
          .select('id')
          .single();

        console.log('🔍 DEBUG: Employee insertion result:', { insertedEmployee, empError });
        
        // Fix 4: Better error handling with exact error message
        if (empError) {
          console.error('🚨 INSERT FAILED:', empError);
          toast.error(empError.message);
          return;
        }
        
        if (!insertedEmployee?.id) {
          console.error('❌ Employee record insertion failed: No ID returned');
          toast.error('Failed to create employee record: No ID returned');
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
      setRefreshKey(prev => prev + 1); // Force re-render and re-fetch
    } catch (error: any) {
      toast.error(`Error ${editingEmployee ? 'updating' : 'adding'} employee: ` + error.message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      toast.success('Employee removed');
      setRefreshKey(prev => prev + 1); // Force re-render and re-fetch
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Employee Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">Manage employee records and information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openAddDialog} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
          <DialogContent className="max-w-4xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                    {editingEmployee ? 'Update Profile' : 'Nurture Talent'}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 font-medium tracking-tight">
                    {editingEmployee ? `Refining details for ${editingEmployee.name}` : 'Onboard a new team member to the organization'}
                  </DialogDescription>
                </div>
              </div>
              <DialogClose asChild>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </DialogClose>
            </div>

            <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
              {/* 🔹 Identity & Basics */}
              <FormSection
                title="Identity & Personal Basics"
                description="Core information about the individual"
                icon={<User className="w-4 h-4 text-blue-600" />}
                accentColor="border-blue-500"
              >
                <FormField label="Full Name" required hint="Legal name as per ID">
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Precious Kaipa"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Email Address" required hint="Used for system login">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. john@company.com"
                    disabled={!!editingEmployee}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400"
                  />
                </FormField>
                <FormField label="Phone Number" hint="Primary contact number">
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+265 991 234 567"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Date of Birth">
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Gender">
                  <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Residential Address" hint="Full home address">
                    <input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, Area 47, Lilongwe"
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* 🔹 Employment Info */}
              <FormSection
                title="Employment Information"
                description="Professional role and assignment"
                icon={<Briefcase className="w-4 h-4 text-green-600" />}
                accentColor="border-green-500"
              >
                <FormField label="Department" required>
                  <Select value={formData.department} onValueChange={(val) => setFormData({ ...formData, department: val })}>
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">Information Technology</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance & Accounts</SelectItem>
                      <SelectItem value="Sales">Sales & Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Position / Title">
                  <input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Employment Type">
                  <Select value={formData.employmentType} onValueChange={(val) => setFormData({ ...formData, employmentType: val })}>
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Probation">Probation</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Manager / Supervisor">
                  <input
                    value={formData.managerSupervisor}
                    onChange={(e) => setFormData({ ...formData, managerSupervisor: e.target.value })}
                    placeholder="Search managers..."
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Work Location">
                  <input
                    value={formData.workLocation}
                    onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                    placeholder="e.g. Main Office - Lilongwe"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Join Date">
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none"
                  />
                </FormField>
              </FormSection>

              {/* 🔹 Emergency Info */}
              <FormSection
                title="Emergency Contact"
                description="In case of medical or critical events"
                icon={<Activity className="w-4 h-4 text-red-600" />}
                accentColor="border-red-500"
              >
                <FormField label="Contact Person Name">
                  <input
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Next of kin name"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Contact Phone">
                  <input
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="Emergency number"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Relationship">
                  <Select value={formData.emergencyContactRelationship} onValueChange={(val) => setFormData({ ...formData, emergencyContactRelationship: val })}>
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </FormSection>

              {/* 🔹 Payroll Basics */}
              <FormSection
                title="Financial & Payroll"
                description="Salary and banking details"
                icon={<CreditCard className="w-4 h-4 text-purple-600" />}
                accentColor="border-purple-500"
              >
                <FormField label="Bank Name">
                  <input
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g. Standard Bank"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Account Number">
                  <input
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="Checking account number"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Tax ID / PIN">
                  <input
                    value={formData.taxIdPin}
                    onChange={(e) => setFormData({ ...formData, taxIdPin: e.target.value })}
                    placeholder="MRA Tax Number"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                  />
                </FormField>
                <FormField label="Salary (Monthly Gross)">
                  <input
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g. 500000"
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none font-bold"
                  />
                </FormField>
                <FormField label="System Role / Permissions">
                  <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 h-11"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee (Normal Access)</SelectItem>
                      <SelectItem value="Manager">Manager (Team Oversight)</SelectItem>
                      <SelectItem value="HR">HR Officer (People Management)</SelectItem>
                      <SelectItem value="Admin">Administrator (Full Control)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </FormSection>
            </div>

            <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <FormActions
                onCancel={() => setIsDialogOpen(false)}
                onSubmit={handleSubmit}
                submitLabel={editingEmployee ? 'Update Records' : 'Onboard Employee'}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md w-[95vw]">
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
                    <p className="text-gray-500 font-semibold mb-1">Email Address</p>
                    <p className="font-medium">{viewingEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Phone</p>
                    <p className="font-medium">{viewingEmployee.phone || 'N/A'}</p>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-gray-500 font-semibold mb-1">Department</p>
                    <p className="font-medium">{viewingEmployee.department}</p>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-gray-500 font-semibold mb-1">Position</p>
                    <p className="font-medium">{viewingEmployee.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Role</p>
                    <p className="font-medium">{viewingEmployee.role || 'Employee'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Join Date</p>
                    <p className="font-medium">{viewingEmployee.join_date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Employment Type</p>
                    <p className="font-medium text-blue-600">{viewingEmployee.employment_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Salary</p>
                    <p className="font-medium">MWK {Number(viewingEmployee.salary || 0).toLocaleString()}</p>
                  </div>
                  <div className="border-t pt-2 mt-2 col-span-2">
                    <p className="text-gray-500 font-semibold mb-1">Work Location</p>
                    <p className="font-medium">{viewingEmployee.work_location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Manager/Supervisor</p>
                    <p className="font-medium">{viewingEmployee.manager_supervisor || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Gender</p>
                    <p className="font-medium">{viewingEmployee.gender || 'N/A'}</p>
                  </div>
                  <div className="border-t pt-2 mt-2 col-span-2">
                    <p className="text-gray-500 font-semibold mb-1">Address</p>
                    <p className="font-medium">{viewingEmployee.address || 'N/A'}</p>
                  </div>
                  <div className="border-t pt-2 mt-2 col-span-2 bg-red-50 p-2 rounded border border-red-100">
                    <p className="text-red-700 font-bold mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Emergency Contact
                    </p>
                    <p className="font-medium text-gray-800">
                      {viewingEmployee.emergency_contact_name || 'N/A'}
                    </p>
                    {viewingEmployee.emergency_contact_phone && (
                      <p className="text-xs text-gray-600">
                        {viewingEmployee.emergency_contact_phone} ({viewingEmployee.emergency_contact_relationship || 'Contact'})
                      </p>
                    )}
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg md:text-xl">All Employees ({employees.length})</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full sm:w-64" />
              </div>
              <Button variant="outline" onClick={() => setRefreshKey(prev => prev + 1)} className="w-full sm:w-auto">
                <Loader2 className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader fullScreen text="Loading employees..." size="lg" />
          ) : (
            <>
            <div className="space-y-3 md:hidden">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{employee.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{employee.employee_id} • {employee.email}</p>
                    </div>
                    <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                      {employee.status}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      <p className="uppercase font-semibold tracking-wide">Department</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{employee.department}</p>
                    </div>
                    <div>
                      <p className="uppercase font-semibold tracking-wide">Position</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{employee.position}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="uppercase font-semibold tracking-wide">Contact</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{employee.phone}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="flex-1 min-w-[110px]" onClick={() => openViewDialog(employee)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 min-w-[110px]" onClick={() => openEditDialog(employee)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 min-w-[110px]" onClick={() => handleResetPassword(employee.email)}>
                      <Key className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 min-w-[110px] text-red-600" onClick={() => handleDeleteEmployee(employee.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
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
            </>
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
