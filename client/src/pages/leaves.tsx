import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { LeaveRequest, LeaveBalance } from '@shared/schema';

export default function LeavesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const { data: leaveRequests } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leaves/requests'],
  });

  const { data: leaveBalances } = useQuery<LeaveBalance[]>({
    queryKey: ['/api/leaves/balances'],
  });

  const createLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/leaves/request', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leaves'] });
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      setIsDialogOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit leave request',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeaveMutation.mutate({
      leaveType,
      startDate,
      endDate,
      reason,
    });
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      approved: <CheckCircle2 className="h-4 w-4 text-status-success" />,
      rejected: <XCircle className="h-4 w-4 text-status-error" />,
      pending: <Clock className="h-4 w-4 text-status-warning" />,
    };
    return icons[status] || null;
  };

  const getStatusVariant = (status: string): any => {
    const variants: Record<string, any> = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary',
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-leaves-title">Leaves</h1>
          <p className="text-muted-foreground">Manage your time off</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-request-leave">
              <Plus className="mr-2 h-4 w-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for approval
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger data-testid="select-leave-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="maternity">Maternity Leave</SelectItem>
                      <SelectItem value="paternity">Paternity Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      data-testid="input-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      min={startDate}
                      data-testid="input-end-date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain your reason for leave..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    minLength={10}
                    data-testid="input-reason"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createLeaveMutation.isPending}
                  data-testid="button-submit-leave"
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {leaveBalances && leaveBalances.length > 0 ? (
          leaveBalances.map((balance) => (
            <Card key={balance.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium capitalize">
                  {balance.leaveType} Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balance.remainingDays}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  of {balance.totalDays} days remaining
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No leave balance information available
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Your leave request history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaveRequests && leaveRequests.length > 0 ? (
              leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium capitalize">{request.leaveType} Leave</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.startDate), 'MMM d, yyyy')} -{' '}
                        {format(new Date(request.endDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.days} day{Number(request.days) !== 1 ? 's' : ''}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                          {request.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <Badge variant={getStatusVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No leave requests found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
