import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Clock, Camera, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Attendance } from '@shared/schema';

export default function AttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [location, setLocation] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const { data: todayAttendance } = useQuery<Attendance>({
    queryKey: ['/api/attendance/today'],
  });

  const { data: attendanceHistory } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance/history'],
  });

  const { data: attendanceCalendar } = useQuery<any>({
    queryKey: ['/api/attendance/calendar', date?.getMonth(), date?.getFullYear()],
  });

  const clockInMutation = useMutation({
    mutationFn: async (useFacial: boolean) => {
      return apiRequest('POST', '/api/attendance/clock-in', {
        location,
        isBiometric: useFacial,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      toast({
        title: 'Success',
        description: 'Clocked in successfully',
      });
      setIsCameraActive(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clock in',
        variant: 'destructive',
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/attendance/clock-out', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      toast({
        title: 'Success',
        description: 'Clocked out successfully',
      });
    },
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        () => {
          setLocation('Location unavailable');
        }
      );
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not access camera',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const handleClockIn = async (useFacial: boolean) => {
    if (useFacial && !isCameraActive) {
      await startCamera();
      return;
    }
    clockInMutation.mutate(useFacial);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: 'bg-status-success',
      absent: 'bg-status-error',
      late: 'bg-status-warning',
      on_leave: 'bg-status-info',
      half_day: 'bg-status-warning',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-attendance-title">Attendance</h1>
        <p className="text-muted-foreground">Track your work hours</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clock In/Out</CardTitle>
            <CardDescription>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">
                {format(new Date(), 'HH:mm')}
              </div>
              <p className="text-sm text-muted-foreground">Current Time</p>
            </div>

            {isCameraActive && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {todayAttendance?.clockIn && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Clock In</span>
                  <span className="font-semibold">
                    {format(new Date(todayAttendance.clockIn), 'HH:mm')}
                  </span>
                </div>
                {todayAttendance.clockOut && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clock Out</span>
                    <span className="font-semibold">
                      {format(new Date(todayAttendance.clockOut), 'HH:mm')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {todayAttendance.location || 'Location not recorded'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!todayAttendance?.clockIn ? (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleClockIn(false)}
                    disabled={clockInMutation.isPending}
                    data-testid="button-clock-in"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Clock In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleClockIn(true)}
                    disabled={clockInMutation.isPending}
                    data-testid="button-clock-in-facial"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Clock In with Facial Recognition
                  </Button>
                  {isCameraActive && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={stopCamera}
                    >
                      Cancel
                    </Button>
                  )}
                </>
              ) : !todayAttendance?.clockOut ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => clockOutMutation.mutate()}
                  disabled={clockOutMutation.isPending}
                  data-testid="button-clock-out"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Clock Out
                </Button>
              ) : (
                <div className="text-center p-4 bg-status-success/10 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-status-success mx-auto mb-2" />
                  <p className="font-semibold">All done for today!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>Your attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                present: attendanceCalendar?.present || [],
                absent: attendanceCalendar?.absent || [],
                late: attendanceCalendar?.late || [],
                leave: attendanceCalendar?.leave || [],
              }}
              modifiersStyles={{
                present: { backgroundColor: 'hsl(142 76% 36%)', color: 'white' },
                absent: { backgroundColor: 'hsl(0 84% 60%)', color: 'white' },
                late: { backgroundColor: 'hsl(43 96% 56%)', color: 'white' },
                leave: { backgroundColor: 'hsl(217 91% 60%)', color: 'white' },
              }}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-success"></div>
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-error"></div>
                <span className="text-xs text-muted-foreground">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-warning"></div>
                <span className="text-xs text-muted-foreground">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-info"></div>
                <span className="text-xs text-muted-foreground">On Leave</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Your attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attendanceHistory && attendanceHistory.length > 0 ? (
              attendanceHistory.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(record.status)}`}></div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(record.date), 'EEEE, MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.clockIn && format(new Date(record.clockIn), 'HH:mm')}
                        {record.clockOut && ` - ${format(new Date(record.clockOut), 'HH:mm')}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                    {record.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No attendance records found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
