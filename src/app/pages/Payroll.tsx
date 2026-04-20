import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DollarSign, Download, FileText, TrendingUp, Users, Calendar, Plus, Play, Gift, MinusCircle, Percent, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { PayrollService, PayrollCycle, PayrollRecord } from '../../lib/payrollService';

export function Payroll() {
  const [payrollCycles, setPayrollCycles] = useState<PayrollCycle[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNewCycleDialog, setShowNewCycleDialog] = useState(false);
  const [newCycleData, setNewCycleData] = useState({
    cycleName: '',
    startDate: '',
    endDate: ''
  });
  const [payrollSummary, setPayrollSummary] = useState({
    totalEmployees: 0,
    totalGross: 0,
    totalNet: 0,
    totalTax: 0,
    totalBonuses: 0,
    totalDeductions: 0,
    totalAllowances: 0,
    totalCTC: 0,
    totalEmployerLiabilities: 0,
    averageSalary: 0
  });
  const [showAdjustmentsModal, setShowAdjustmentsModal] = useState(false);
  const [employeesForAdjustments, setEmployeesForAdjustments] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, {
    overtimeHours: number;
    performanceBonus: number;
    otherBonus: number;
    manualDeduction: number;
  }>>({});
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslipRecord, setSelectedPayslipRecord] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('cycles');
  useEffect(() => {
    loadPayrollData();
  }, []);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      // Load payroll cycles
      const cycles = await PayrollService.getPayrollCycles();
      setPayrollCycles(cycles);

      // Load payroll summary
      const summary = await PayrollService.getPayrollSummary();
      setPayrollSummary(summary);

      // Load payroll records
      const records = await PayrollService.getPayrollRecords();
      setPayrollRecords(records);

      // Set default selected cycle
      if (cycles.length > 0) {
        setSelectedCycle(cycles[0].id);
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  // Create new payroll cycle
  const handleCreateCycle = async () => {
    if (!newCycleData.cycleName || !newCycleData.startDate || !newCycleData.endDate) {
      toast.error('Please fill in all cycle details');
      return;
    }

    try {
      const cycle = await PayrollService.createPayrollCycle(
        newCycleData.cycleName,
        new Date(newCycleData.startDate),
        new Date(newCycleData.endDate)
      );

      if (cycle) {
        toast.success('Payroll cycle created successfully');
        setShowNewCycleDialog(false);
        setNewCycleData({ cycleName: '', startDate: '', endDate: '' });
        loadPayrollData();
      } else {
        toast.error('Failed to create payroll cycle. Database schema may not be properly configured.');
      }
    } catch (error) {
      console.error('Error creating payroll cycle:', error);
      toast.error('Failed to create payroll cycle. Please ensure database schema is properly configured.');
    }
  };

  const downloadMRAReport = () => {
    if (!selectedCycle) return;
    
    const records = getFilteredRecords();
    if (records.length === 0) {
      toast.error('No records to export. Please process payroll first.');
      return;
    }

    const headers = [
      'Employee Name', 'PIN (Tax ID)', 'Gross Income', 'Pension (5%)', 
      'Taxable Income', 'PAYE Tax', 'Net Pay', 'Employer Pension (10%)', 'TEVET Levy (1%)'
    ];

    const csvRows = records.map(record => [
      record.employees?.name,
      record.employees?.tax_id || 'N/A',
      record.grossSalary,
      record.pensionContrib,
      record.grossSalary - record.pensionContrib,
      record.payeTax,
      record.netSalary,
      record.employer_pension || record.grossSalary * 0.10, // Uses persisted Employer Pension (10%) or falls back to gross-based
      record.tevet_levy || record.baseSalary * 0.01  // Uses persisted TEVET or falls back to base-based
    ]);

    const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cycle = payrollCycles.find(c => c.id === selectedCycle);
    const fileName = cycle ? `MRA_Report_${cycle.cycleName.replace(/\s+/g, '_')}.csv` : `MRA_Report_${selectedCycle}.csv`;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('MRA Report downloaded successfully');
  };

  const handleOpenAdjustments = async () => {
    if (!selectedCycle) {
      toast.error('Please select a payroll cycle first');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'Active');

      if (error) {
        toast.error('Failed to fetch employees');
        return;
      }

      if (employees && employees.length > 0) {
        setEmployeesForAdjustments(employees);
        const initialAdjustments: Record<string, any> = {};
        employees.forEach((emp: any) => {
          initialAdjustments[emp.id] = {
            overtimeHours: 0,
            performanceBonus: 0,
            otherBonus: 0,
            manualDeduction: 0
          };
        });
        setAdjustments(initialAdjustments);
        setShowAdjustmentsModal(true);
      } else {
        toast.error('No active employees found to process');
      }
    } catch (err) {
      console.error('Error opening adjustments:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalProcess = async () => {
    setIsProcessing(true);
    try {
      const result = await PayrollService.processPayrollCycle(selectedCycle, employeesForAdjustments, adjustments);

      if (result.success) {
        toast.success('Payroll processed successfully');
        setShowAdjustmentsModal(false);
        loadPayrollData();
      } else {
        toast.error(`Processing failed: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Unexpected error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateAdjustment = (empId: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAdjustments(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: numValue
      }
    }));
  };

  // Get filtered payroll records for selected cycle
  const getFilteredRecords = () => {
    if (!selectedCycle) return payrollRecords;
    return payrollRecords.filter(record => record.cycleId === selectedCycle);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Malawi Payroll Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">MRA & Pension Act Compliant Payroll System</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadMRAReport()} disabled={!selectedCycle}>
            <Download className="w-4 h-4 mr-2" />
            MRA Report
          </Button>
          <Button onClick={() => setShowNewCycleDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Cycle
          </Button>
          <Button onClick={handleOpenAdjustments} disabled={isProcessing || !selectedCycle}>
            <Play className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Process Payroll'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollSummary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollSummary.totalGross)}</div>
            <p className="text-xs text-muted-foreground">Before deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollSummary.totalNet)}</div>
            <p className="text-xs text-muted-foreground">After deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax (PAYE)</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollSummary.totalTax)}</div>
            <p className="text-xs text-muted-foreground">Income tax</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollSummary.totalBonuses)}</div>
            <p className="text-xs text-muted-foreground">Performance & others</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollSummary.totalDeductions)}</div>
            <p className="text-xs text-muted-foreground">All deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allowances</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollSummary.totalAllowances)}</div>
            <p className="text-xs text-muted-foreground">Housing, transport, etc.</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Company Cost (CTC)</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatCurrency(payrollSummary.totalCTC)}</div>
            <p className="text-xs text-muted-foreground">Gross + Employer Pension + TEVET</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities (Due 14th)</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(payrollSummary.totalEmployerLiabilities)}</div>
            <p className="text-xs text-muted-foreground">PAYE + All Pension + TEVET</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Net Pay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollSummary.averageSalary)}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Cycles and Records */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="cycles">Payroll Cycles</TabsTrigger>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
        </TabsList>

        <TabsContent value="cycles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Cycles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payrollCycles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No payroll cycles found</p>
                    <Button onClick={() => setShowNewCycleDialog(true)} className="mt-2">
                      Create First Cycle
                    </Button>
                  </div>
                ) : (
                  payrollCycles.map((cycle) => (
                    <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{cycle.cycleName}</h3>
                          <p className="text-sm text-gray-500">
                            {cycle.startDate ? new Date(cycle.startDate).toLocaleDateString() : 'Invalid Date'} - {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : 'Invalid Date'}
                          </p>
                        </div>
                        <Badge className={getStatusBadgeColor(cycle.status)}>
                          {cycle.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{cycle.totalEmployees} employees</p>
                          <p className="text-sm text-gray-500">{formatCurrency(cycle.totalNet)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('View Details clicked for cycle:', cycle.id);
                            setSelectedCycle(cycle.id);
                            setActiveTab('records');
                          }}
                          className="cursor-pointer"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payroll Records</CardTitle>
                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollCycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.cycleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredRecords().length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No payroll records found</p>
                    <p className="text-sm text-gray-400">Process a payroll cycle to generate records</p>
                  </div>
                ) : (
                  getFilteredRecords().map((record) => (
                    <div key={record.id} className="border rounded-lg">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium">{record.employees?.name}</h3>
                            <p className="text-sm text-gray-500">{record.employees?.department} - {record.employees?.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Base</p>
                            <p className="font-medium">{formatCurrency(record.baseSalary)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Gross</p>
                            <p className="font-medium">{formatCurrency(record.grossSalary)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Net</p>
                            <p className="font-medium">{formatCurrency(record.netSalary)}</p>
                          </div>
                          <Badge className={getStatusBadgeColor(record.paymentStatus)}>
                            {record.paymentStatus}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedPayslipRecord(record);
                              setShowPayslipModal(true);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Payslip
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Allowances</p>
                          <p className="font-medium">{formatCurrency(record.housingAllowance + record.transportAllowance + record.mealAllowance + record.otherAllowances)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Deductions</p>
                          <p className="font-medium">{formatCurrency(record.payeTax + record.pensionContrib + record.healthInsurance + record.otherDeductions)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Overtime</p>
                          <p className="font-medium">{record.overtimeHours}h × {formatCurrency(record.overtimeRate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Bonuses</p>
                          <p className="font-medium">{formatCurrency(record.performanceBonus + record.otherBonus)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Cycle Dialog */}
      <Dialog open={showNewCycleDialog} onOpenChange={setShowNewCycleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Payroll Cycle</DialogTitle>
            <DialogDescription>
              Create a new payroll cycle for processing employee payments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cycleName">Cycle Name</Label>
              <Input
                id="cycleName"
                value={newCycleData.cycleName}
                onChange={(e) => setNewCycleData({ ...newCycleData, cycleName: e.target.value })}
                placeholder="e.g., March 2026"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={newCycleData.startDate}
                onChange={(e) => setNewCycleData({ ...newCycleData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={newCycleData.endDate}
                onChange={(e) => setNewCycleData({ ...newCycleData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewCycleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCycle}>
              Create Cycle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Adjustments Modal */}
      <Dialog open={showAdjustmentsModal} onOpenChange={setShowAdjustmentsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Adjustments</DialogTitle>
            <DialogDescription>
              Enter variable pay items for each employee for the current cycle.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Employee</th>
                    <th className="px-4 py-2 text-left">Overtime (Hrs)</th>
                    <th className="px-4 py-2 text-left">Perf. Bonus</th>
                    <th className="px-4 py-2 text-left">Other Bonus</th>
                    <th className="px-4 py-2 text-left">Deductions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employeesForAdjustments.map((emp) => (
                    <tr key={emp.id}>
                      <td className="px-4 py-2 font-medium">{emp.name}</td>
                      <td className="px-4 py-2">
                        <Input 
                          type="number" 
                          className="w-24 h-8"
                          value={adjustments[emp.id]?.overtimeHours || 0}
                          onChange={(e) => updateAdjustment(emp.id, 'overtimeHours', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          type="number" 
                          className="w-24 h-8"
                          value={adjustments[emp.id]?.performanceBonus || 0}
                          onChange={(e) => updateAdjustment(emp.id, 'performanceBonus', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          type="number" 
                          className="w-24 h-8"
                          value={adjustments[emp.id]?.otherBonus || 0}
                          onChange={(e) => updateAdjustment(emp.id, 'otherBonus', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          type="number" 
                          className="w-24 h-8"
                          value={adjustments[emp.id]?.manualDeduction || 0}
                          onChange={(e) => updateAdjustment(emp.id, 'manualDeduction', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAdjustmentsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleFinalProcess} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Confirm & Process Payroll'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payslip Modal */}
      <Dialog open={showPayslipModal} onOpenChange={setShowPayslipModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Payslip</DialogTitle>
          </DialogHeader>
          
          {selectedPayslipRecord && (
            <div className="space-y-6 p-4 border rounded-lg bg-white overflow-hidden" id="printable-payslip">
              <div className="flex justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold">HR Management System</h2>
                  <p className="text-sm text-gray-500">MRA & Pension Compliant Payroll</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">PAYSLIP</p>
                  <p className="text-sm text-gray-500">Period: {payrollCycles.find(c => c.id === selectedPayslipRecord.cycleId)?.cycleName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-gray-500 uppercase text-xs font-bold mb-1">Employee Details</p>
                  <p className="font-bold">{selectedPayslipRecord.employees?.name}</p>
                  <p>{selectedPayslipRecord.employees?.position}</p>
                  <p>Dept: {selectedPayslipRecord.employees?.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 uppercase text-xs font-bold mb-1">Payment Summary</p>
                  <p>Pay Date: {new Date().toLocaleDateString()}</p>
                  <p>Account: {selectedPayslipRecord.employees?.account_number || 'Bank Transfer'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 uppercase text-xs font-bold">
                      <tr>
                        <th className="px-4 py-2 text-left">Earnings</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-2">Basic Salary</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(selectedPayslipRecord.baseSalary)}</td>
                      </tr>
                      {(selectedPayslipRecord.housingAllowance > 0) && (
                        <tr>
                          <td className="px-4 py-2">Housing Allowance</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(selectedPayslipRecord.housingAllowance)}</td>
                        </tr>
                      )}
                      {(selectedPayslipRecord.performanceBonus > 0) && (
                        <tr>
                          <td className="px-4 py-2 text-blue-600">Performance Bonus</td>
                          <td className="px-4 py-2 text-right text-blue-600">{formatCurrency(selectedPayslipRecord.performanceBonus)}</td>
                        </tr>
                      )}
                      {(selectedPayslipRecord.overtimePay > 0) && (
                        <tr>
                          <td className="px-4 py-2">Overtime ({selectedPayslipRecord.overtimeHours} hours)</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(selectedPayslipRecord.overtimePay)}</td>
                        </tr>
                      )}
                      <tr className="bg-gray-50 font-bold border-t-2">
                        <td className="px-4 py-2">Gross Salary</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(selectedPayslipRecord.grossSalary)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 uppercase text-xs font-bold">
                      <tr>
                        <th className="px-4 py-2 text-left">Deductions</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-2">PAYE Tax (MRA)</td>
                        <td className="px-4 py-2 text-right text-red-600">{formatCurrency(selectedPayslipRecord.payeTax)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Pension Contribution (5%)</td>
                        <td className="px-4 py-2 text-right text-red-600">{formatCurrency(selectedPayslipRecord.pensionContrib)}</td>
                      </tr>
                      {selectedPayslipRecord.otherDeductions > 0 && (
                        <tr>
                          <td className="px-4 py-2">Other Deductions</td>
                          <td className="px-4 py-2 text-right text-red-600">{formatCurrency(selectedPayslipRecord.otherDeductions)}</td>
                        </tr>
                      )}
                      <tr className="bg-gray-50 font-bold border-t-2">
                        <td className="px-4 py-2">Total Deductions</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(selectedPayslipRecord.totalDeductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-600 text-white p-4 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-lg uppercase tracking-wider">Net Pay</span>
                  <span className="text-2xl font-black">{formatCurrency(selectedPayslipRecord.netSalary)}</span>
                </div>
                
                <div className="text-[10px] text-gray-400 italic text-center">
                  This is a computer-generated document and is valid without a signature.
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowPayslipModal(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              Print Payslip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
