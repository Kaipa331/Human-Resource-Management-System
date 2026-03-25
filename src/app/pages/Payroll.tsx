import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DollarSign, Download, FileText, TrendingUp, Users, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export function Payroll() {
  const [payrollCycles, setPayrollCycles] = useState([
    {
      id: 'PAY001',
      period: 'March 2026',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      totalEmployees: 247,
      grossTotal: 'MWK 210,450,000',
      netTotal: 'MWK 168,360,000',
      status: 'In Progress',
      payDate: '2026-03-31'
    },
    {
      id: 'PAY002',
      period: 'February 2026',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      totalEmployees: 245,
      grossTotal: 'MWK 208,800,000',
      netTotal: 'MWK 167,040,000',
      status: 'Completed',
      payDate: '2026-02-28'
    },
    {
      id: 'PAY003',
      period: 'January 2026',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      totalEmployees: 242,
      grossTotal: 'MWK 206,400,000',
      netTotal: 'MWK 165,120,000',
      status: 'Completed',
      payDate: '2026-01-31'
    },
  ]);

  const employeePayroll = [
    {
      employeeId: 'EMP001',
      name: 'John Doe',
      department: 'IT',
      basicSalary: 850000,
      allowances: 150000,
      gross: 1000000,
      deductions: 200000,
      net: 800000,
      taxDeducted: 150000,
      payeeTax: 'PAYE 30%'
    },
    {
      employeeId: 'EMP002',
      name: 'Sarah Williams',
      department: 'HR',
      basicSalary: 1200000,
      allowances: 200000,
      gross: 1400000,
      deductions: 280000,
      net: 1120000,
      taxDeducted: 210000,
      payeeTax: 'PAYE 30%'
    },
    {
      employeeId: 'EMP003',
      name: 'Michael Brown',
      department: 'Sales',
      basicSalary: 750000,
      allowances: 100000,
      gross: 850000,
      deductions: 170000,
      net: 680000,
      taxDeducted: 127500,
      payeeTax: 'PAYE 30%'
    },
  ];

  const payrollSummary = {
    totalGross: 'MWK 210,450,000',
    totalNet: 'MWK 168,360,000',
    totalTax: 'MWK 31,567,500',
    totalDeductions: 'MWK 42,090,000',
    employees: 247
  };

  const handleProcessPayroll = (id: string) => {
    setPayrollCycles(payrollCycles.map(cycle => 
      cycle.id === id ? { ...cycle, status: 'Completed' } : cycle
    ));
    toast.success('Payroll processed successfully');
  };

  const handleDownloadPayslip = (employeeName: string) => {
    toast.success(`Downloading payslip for ${employeeName}`);
  };

  const formatCurrency = (amount: number) => {
    return `MWK ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-500 mt-1">Process and manage employee payroll</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Generate Payroll Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Gross</p>
                <h3 className="text-2xl font-bold mt-1">{payrollSummary.totalGross}</h3>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Net</p>
                <h3 className="text-2xl font-bold mt-1">{payrollSummary.totalNet}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tax (PAYE)</p>
                <h3 className="text-2xl font-bold mt-1">{payrollSummary.totalTax}</h3>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Employees</p>
                <h3 className="text-2xl font-bold mt-1">{payrollSummary.employees}</h3>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cycles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cycles">Payroll Cycles</TabsTrigger>
          <TabsTrigger value="employees">Employee Payroll</TabsTrigger>
          <TabsTrigger value="statutory">Statutory Deductions</TabsTrigger>
        </TabsList>

        <TabsContent value="cycles">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Cycles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payrollCycles.map((cycle) => (
                  <div key={cycle.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <h3 className="text-xl font-semibold">{cycle.period}</h3>
                          <Badge variant={cycle.status === 'Completed' ? 'default' : 'secondary'}>
                            {cycle.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Period</p>
                            <p className="font-medium">{cycle.startDate} to {cycle.endDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Employees</p>
                            <p className="font-medium">{cycle.totalEmployees}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Gross Total</p>
                            <p className="font-medium">{cycle.grossTotal}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Net Total</p>
                            <p className="font-medium text-green-600">{cycle.netTotal}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {cycle.status === 'In Progress' ? (
                        <>
                          <Button onClick={() => handleProcessPayroll(cycle.id)}>
                            Process Payroll
                          </Button>
                          <Button variant="outline">
                            Edit
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                          </Button>
                          <Button variant="outline">
                            View Details
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll Details - March 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeePayroll.map((emp) => (
                  <div key={emp.employeeId} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{emp.name}</h3>
                        <p className="text-sm text-gray-500">{emp.employeeId} • {emp.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Net Salary</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(emp.net)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Basic Salary</p>
                        <p className="text-lg font-semibold text-blue-600">{formatCurrency(emp.basicSalary)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Allowances</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(emp.allowances)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Tax ({emp.payeeTax})</p>
                        <p className="text-lg font-semibold text-orange-600">{formatCurrency(emp.taxDeducted)}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Other Deductions</p>
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(emp.deductions - emp.taxDeducted)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadPayslip(emp.name)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Payslip
                      </Button>
                      <Button size="sm" variant="outline">
                        View Breakdown
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statutory">
          <Card>
            <CardHeader>
              <CardTitle>Statutory Deductions - March 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">PAYE (Pay As You Earn) Tax</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total PAYE Collected</p>
                      <p className="text-2xl font-bold">MWK 31,567,500</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Employees Subject to PAYE</p>
                      <p className="text-2xl font-bold">247</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className="mt-2">Ready for Remittance</Badge>
                    </div>
                  </div>
                  <Button className="mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Generate PAYE Report
                  </Button>
                </div>

                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Pension Contributions</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Employee Contributions</p>
                      <p className="text-2xl font-bold">MWK 5,261,250</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Employer Contributions</p>
                      <p className="text-2xl font-bold">MWK 5,261,250</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold">MWK 10,522,500</p>
                    </div>
                  </div>
                  <Button className="mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Generate Pension Report
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-yellow-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">Compliance Reminder</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        PAYE and pension remittance to Malawi Revenue Authority (MRA) is due by the 14th of the following month. 
                        Next deadline: April 14, 2026
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
