import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DollarSign, Download, FileText, TrendingUp, Users, Calendar, Plus, Play } from 'lucide-react';
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
    averageSalary: 0
  });

  // Load payroll data on component mount
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
        toast.error('Failed to create payroll cycle');
      }
    } catch (error) {
      console.error('Error creating payroll cycle:', error);
      toast.error('Failed to create payroll cycle');
    }
  };

  // Process payroll for selected cycle
  const handleProcessPayroll = async () => {
    if (!selectedCycle) {
      toast.error('Please select a payroll cycle');
      return;
    }

    setIsProcessing(true);
    try {
      // Get employees for payroll processing
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'Active');

      if (error) throw error;

      if (employees && employees.length > 0) {
        const success = await PayrollService.processPayrollCycle(selectedCycle, employees);
        
        if (success) {
          toast.success('Payroll processed successfully');
          loadPayrollData();
        } else {
          toast.error('Failed to process payroll');
        }
      } else {
        toast.error('No active employees found');
      }
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast.error('Failed to process payroll');
    } finally {
      setIsProcessing(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payroll Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage employee payroll and compensation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewCycleDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Cycle
          </Button>
          <Button onClick={handleProcessPayroll} disabled={isProcessing || !selectedCycle}>
            <Play className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Process Payroll'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollSummary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
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
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollSummary.averageSalary)}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Cycles and Records */}
      <Tabs defaultValue="cycles" className="space-y-4">
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
                            {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
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
                          onClick={() => setSelectedCycle(cycle.id)}
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
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{record.employees?.name}</h3>
                          <p className="text-sm text-gray-500">{record.employees?.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
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
    </div>
  );
}
