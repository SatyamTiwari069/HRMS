import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { PayrollRecord } from '@shared/schema';

export default function PayrollPage() {
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  const { data: payrollRecords } = useQuery<PayrollRecord[]>({
    queryKey: ['/api/payroll/records'],
  });

  const { data: currentMonthPayroll } = useQuery<PayrollRecord>({
    queryKey: ['/api/payroll/current'],
  });

  const handleDownloadPayslip = (payrollId: string) => {
    // Download payslip PDF
    window.open(`/api/payroll/${payrollId}/payslip`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-payroll-title">Payroll</h1>
        <p className="text-muted-foreground">View your salary and payslips</p>
      </div>

      {currentMonthPayroll && (
        <Card>
          <CardHeader>
            <CardTitle>Current Month</CardTitle>
            <CardDescription>
              {format(new Date(currentMonthPayroll.year, currentMonthPayroll.month - 1), 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Salary</p>
                    <p className="text-3xl font-bold">${currentMonthPayroll.netSalary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Days Worked</p>
                      <p className="text-xl font-semibold">{currentMonthPayroll.daysWorked}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Days Absent</p>
                      <p className="text-xl font-semibold">{currentMonthPayroll.daysAbsent}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-status-success/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-status-success" />
                    <span className="text-sm font-medium">Earnings</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ${(Number(currentMonthPayroll.baseSalary) + Number(currentMonthPayroll.bonuses) + Number(currentMonthPayroll.overtime)).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Base + Bonuses + Overtime
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-status-error/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-status-error" />
                    <span className="text-sm font-medium">Deductions</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ${(Number(currentMonthPayroll.deductions) + Number(currentMonthPayroll.tax)).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tax + Other
                    </p>
                  </div>
                </div>

                {currentMonthPayroll.payslipUrl && (
                  <Button
                    className="w-full"
                    onClick={() => handleDownloadPayslip(currentMonthPayroll.id)}
                    data-testid="button-download-payslip"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Payslip
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>Your salary records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payrollRecords && payrollRecords.length > 0 ? (
              payrollRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                  onClick={() => setSelectedPayroll(record)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(record.year, record.month - 1), 'MMMM yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.daysWorked} days worked
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${record.netSalary}</p>
                    {record.paidAt && (
                      <Badge variant="default" className="mt-1">
                        Paid
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No payroll records found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPayroll && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Details</CardTitle>
            <CardDescription>
              {format(new Date(selectedPayroll.year, selectedPayroll.month - 1), 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold text-status-success">Earnings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Base Salary</span>
                    <span className="font-medium">${selectedPayroll.baseSalary}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Bonuses</span>
                    <span className="font-medium">${selectedPayroll.bonuses}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Overtime</span>
                    <span className="font-medium">${selectedPayroll.overtime}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Total Earnings</span>
                    <span className="text-status-success">
                      ${(Number(selectedPayroll.baseSalary) + Number(selectedPayroll.bonuses) + Number(selectedPayroll.overtime)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-status-error">Deductions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Tax</span>
                    <span className="font-medium">${selectedPayroll.tax}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Other Deductions</span>
                    <span className="font-medium">${selectedPayroll.deductions}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Total Deductions</span>
                    <span className="text-status-error">
                      ${(Number(selectedPayroll.tax) + Number(selectedPayroll.deductions)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Net Salary</span>
                <span className="text-3xl font-bold text-primary">
                  ${selectedPayroll.netSalary}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
