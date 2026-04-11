import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DollarSign, Download, FileText, TrendingUp, Users, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

type PayrollCycle = {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  totalEmployees: number;
  grossTotal: string;
  netTotal: string;
  status: string;
  payDate: string;
};

type PayrollSummary = {
  totalGross: string;
  totalNet: string;
  totalTax: string;
  totalDeductions: string;
  employees: number;
};

type EmployeePayrollRow = {
  employeeId: string;
  name: string;
  department: string;
  basicSalary: number;
  allowances: number;
  gross: number;
  deductions: number;
  net: number;
  taxDeducted: number;
  payeeTax: string;
};

const INITIAL_PAYROLL_CYCLES: PayrollCycle[] = [
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
];

const INITIAL_PAYROLL_SUMMARY: PayrollSummary = {
  totalGross: 'MWK 210,450,000',
  totalNet: 'MWK 168,360,000',
  totalTax: 'MWK 31,567,500',
  totalDeductions: 'MWK 42,090,000',
  employees: 247
};

export function Payroll() {
  const [payrollCycles, setPayrollCycles] = useState<PayrollCycle[]>(INITIAL_PAYROLL_CYCLES);
  const [employeePayroll, setEmployeePayroll] = useState<EmployeePayrollRow[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('March 2026');
  const [statutory, setStatutory] = useState({
    totalPaye: 0,
    employeeContrib: 0,
    employerContrib: 0,
    employees: 0,
  });

  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>(INITIAL_PAYROLL_SUMMARY);
  const [loading, setLoading] = useState(false);

  const [activeCycleForDetails, setActiveCycleForDetails] = useState<PayrollCycle | null>(null);
  const [isCycleDialogOpen, setIsCycleDialogOpen] = useState(false);

  const [activeEmployeeForBreakdown, setActiveEmployeeForBreakdown] = useState<EmployeePayrollRow | null>(null);
  const [isBreakdownDialogOpen, setIsBreakdownDialogOpen] = useState(false);

  useEffect(() => {
    const loadPayrollFromBackend = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('payroll')
          .select('period, basics, bonuses, deductions, net_pay, employee_id, status');

        if (error || !data || data.length === 0) {
          return;
        }

        const byPeriod = new Map<string, {
          gross: number;
          net: number;
          deductions: number;
          employees: Set<string>;
          status: string;
        }>();

        for (const row of data as any[]) {
          const period = row.period as string;
          if (!period) continue;
          const basics = Number(row.basics ?? 0);
          const bonuses = Number(row.bonuses ?? 0);
          const net = Number(row.net_pay ?? 0);
          const deductions = Number(row.deductions ?? 0);
          const employeeId = String(row.employee_id ?? '');
          const status = String(row.status ?? 'Completed');

          if (!byPeriod.has(period)) {
            byPeriod.set(period, {
              gross: 0,
              net: 0,
              deductions: 0,
              employees: new Set<string>(),
              status,
            });
          }

          const agg = byPeriod.get(period)!;
          agg.gross += basics + bonuses;
          agg.net += net;
          agg.deductions += deductions;
          if (employeeId) agg.employees.add(employeeId);
          // If any row is not completed, mark the cycle as in progress
          if (status !== 'Completed') {
            agg.status = 'In Progress';
          }
        }

        const formattedCycles: PayrollCycle[] = [];
        let totalGross = 0;
        let totalNet = 0;
        let totalDeductions = 0;
        let totalEmployees = 0;

        for (const [period, agg] of byPeriod.entries()) {
          totalGross += agg.gross;
          totalNet += agg.net;
          totalDeductions += agg.deductions;
          totalEmployees += agg.employees.size;

          formattedCycles.push({
            id: period,
            period,
            startDate: '',
            endDate: '',
            totalEmployees: agg.employees.size,
            grossTotal: `MWK ${agg.gross.toLocaleString()}`,
            netTotal: `MWK ${agg.net.toLocaleString()}`,
            status: agg.status,
            payDate: '',
          });
        }

        if (formattedCycles.length > 0) {
          formattedCycles.sort((a, b) => b.period.localeCompare(a.period));
          setPayrollCycles(formattedCycles);
          setSelectedPeriod(formattedCycles[0].period);
          setPayrollSummary({
            totalGross: `MWK ${totalGross.toLocaleString()}`,
            totalNet: `MWK ${totalNet.toLocaleString()}`,
            totalTax: `MWK ${totalDeductions.toLocaleString()}`,
            totalDeductions: `MWK ${totalDeductions.toLocaleString()}`,
            employees: totalEmployees,
          });
        }
      } catch (err) {
        console.error('Error loading payroll data', err);
      } finally {
        setLoading(false);
      }
    };

    loadPayrollFromBackend();
  }, []);

  useEffect(() => {
    const loadEmployeePayroll = async () => {
      if (!selectedPeriod) return;
      try {
        const { data, error } = await supabase
          .from('payroll')
          .select(`
            employee_id,
            basics,
            bonuses,
            deductions,
            net_pay,
            period,
            employees:employee_id (
              employee_id,
              name,
              department
            )
          `)
          .eq('period', selectedPeriod);

        if (error || !data) return;

        const rows: EmployeePayrollRow[] = (data as any[]).map((row) => {
          const basic = Number(row.basics ?? 0);
          const allowances = Number(row.bonuses ?? 0);
          const deductions = Number(row.deductions ?? 0);
          const net = Number(row.net_pay ?? 0);
          const gross = basic + allowances;
          const taxDeducted = Math.max(deductions * 0.75, 0);

          const employee = row.employees || {};
          return {
            employeeId: employee.employee_id || String(row.employee_id ?? ''),
            name: employee.name || 'Unknown',
            department: employee.department || 'N/A',
            basicSalary: basic,
            allowances,
            gross,
            deductions,
            net,
            taxDeducted,
            payeeTax: 'PAYE 30%',
          };
        });

        setEmployeePayroll(rows);

        const totalPaye = rows.reduce((sum, r) => sum + r.taxDeducted, 0);
        const employeeContrib = rows.reduce((sum, r) => sum + r.gross * 0.05, 0);
        setStatutory({
          totalPaye,
          employeeContrib,
          employerContrib: employeeContrib,
          employees: rows.length,
        });
      } catch (err) {
        console.error('Error loading employee payroll details', err);
      }
    };

    loadEmployeePayroll();
  }, [selectedPeriod]);

  const handleProcessPayroll = async (period: string) => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ status: 'Completed' })
        .eq('period', period);

      if (error) throw error;
      setPayrollCycles(payrollCycles.map(cycle =>
        cycle.period === period ? { ...cycle, status: 'Completed' } : cycle
      ));
      toast.success('Payroll processed successfully');
    } catch (error: any) {
      toast.error('Failed to process payroll: ' + error.message);
    }
  };

  const handleDownloadPayslip = (employeeName: string) => {
    toast.success(`Downloading payslip for ${employeeName}`);
  };

  const handleDownloadReport = (reportType: string) => {
    toast.success(`Downloading ${reportType}...`);
  };

  const formatCurrency = (amount: number) => {
    return `MWK ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payroll Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Process and manage employee payroll</p>
        </div>
        <Button onClick={() => handleDownloadReport('Master Payroll Report')}>
          <FileText className="w-4 h-4 mr-2" />
          Generate Payroll Report
        </Button>
      </div>

      <Dialog open={isCycleDialogOpen} onOpenChange={setIsCycleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payroll Cycle Details</DialogTitle>
            <DialogDescription>{activeCycleForDetails?.period}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div><p className="text-gray-500 dark:text-gray-400">Gross Total</p><p className="font-medium">{activeCycleForDetails?.grossTotal}</p></div>
              <div><p className="text-gray-500 dark:text-gray-400">Net Total</p><p className="font-medium">{activeCycleForDetails?.netTotal}</p></div>
              <div><p className="text-gray-500 dark:text-gray-400">Total Employees</p><p className="font-medium">{activeCycleForDetails?.totalEmployees}</p></div>
              <div><p className="text-gray-500 dark:text-gray-400">Status</p><Badge>{activeCycleForDetails?.status}</Badge></div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsCycleDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBreakdownDialogOpen} onOpenChange={setIsBreakdownDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salary Breakdown</DialogTitle>
            <DialogDescription>{activeEmployeeForBreakdown?.name} - {activeEmployeeForBreakdown?.department}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600 dark:text-gray-300">Basic Salary</span>
              <span className="font-medium">{activeEmployeeForBreakdown && formatCurrency(activeEmployeeForBreakdown.basicSalary)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600 dark:text-gray-300">Allowances</span>
              <span className="font-medium text-green-600 dark:text-green-400">+{activeEmployeeForBreakdown && formatCurrency(activeEmployeeForBreakdown.allowances)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600 dark:text-gray-300">PAYE Tax</span>
              <span className="font-medium text-red-600 dark:text-red-400">-{activeEmployeeForBreakdown && formatCurrency(activeEmployeeForBreakdown.taxDeducted)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600 dark:text-gray-300">Other Deductions</span>
              <span className="font-medium text-red-600 dark:text-red-400">-{activeEmployeeForBreakdown && formatCurrency(activeEmployeeForBreakdown.deductions - activeEmployeeForBreakdown.taxDeducted)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>Net Pay</span>
              <span className="text-blue-600">{activeEmployeeForBreakdown && formatCurrency(activeEmployeeForBreakdown.net)}</span>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsBreakdownDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Gross</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Net</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tax (PAYE)</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Employees</p>
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">Period</p>
                            <p className="font-medium">{cycle.startDate} to {cycle.endDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Employees</p>
                            <p className="font-medium">{cycle.totalEmployees}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Gross Total</p>
                            <p className="font-medium">{cycle.grossTotal}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Net Total</p>
                            <p className="font-medium text-green-600">{cycle.netTotal}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {cycle.status === 'In Progress' ? (
                        <>
                          <Button onClick={() => handleProcessPayroll(cycle.period)}>
                            Process Payroll
                          </Button>
                          <Button variant="outline" onClick={() => toast.success('Saved as Draft')}>
                            Edit
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" onClick={() => handleDownloadReport(`Cycle Report ${cycle.period}`)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                          </Button>
                          <Button variant="outline" onClick={() => { setActiveCycleForDetails(cycle); setIsCycleDialogOpen(true); }}>
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
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Employee Payroll Details - {selectedPeriod}</CardTitle>
                <select
                  className="border rounded-md px-3 py-1.5 text-sm"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  {payrollCycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.period}>{cycle.period}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeePayroll.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No payroll rows found for this period.</p>
                )}
                {employeePayroll.map((emp) => (
                  <div key={emp.employeeId} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{emp.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{emp.employeeId} • {emp.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Net Salary</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(emp.net)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300">Basic Salary</p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(emp.basicSalary)}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300">Allowances</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(emp.allowances)}</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300">Tax ({emp.payeeTax})</p>
                        <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(emp.taxDeducted)}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300">Other Deductions</p>
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatCurrency(emp.deductions - emp.taxDeducted)}</p>
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
                      <Button size="sm" variant="outline" onClick={() => { setActiveEmployeeForBreakdown(emp); setIsBreakdownDialogOpen(true); }}>
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
              <CardTitle>Statutory Deductions - {selectedPeriod}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">PAYE (Pay As You Earn) Tax</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total PAYE Collected</p>
                      <p className="text-2xl font-bold">{formatCurrency(statutory.totalPaye)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Employees Subject to PAYE</p>
                      <p className="text-2xl font-bold">{statutory.employees}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <Badge className="mt-2">Ready for Remittance</Badge>
                    </div>
                  </div>
                  <Button className="mt-4" onClick={() => handleDownloadReport('PAYE Report')}>
                    <Download className="w-4 h-4 mr-2" />
                    Generate PAYE Report
                  </Button>
                </div>

                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Pension Contributions</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Employee Contributions</p>
                      <p className="text-2xl font-bold">{formatCurrency(statutory.employeeContrib)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Employer Contributions</p>
                      <p className="text-2xl font-bold">{formatCurrency(statutory.employerContrib)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold">{formatCurrency(statutory.employeeContrib + statutory.employerContrib)}</p>
                    </div>
                  </div>
                  <Button className="mt-4" onClick={() => handleDownloadReport('Pension Report')}>
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
