import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalEmployees?: number;
  presentToday?: number;
  pendingLeaves?: number;
  avgPerformance?: number;
  attendanceRate?: number;
  pendingRecruitments?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: attendanceTrend } = useQuery<any>({
    queryKey: ['/api/dashboard/attendance-trend'],
  });

  const { data: recentActivity } = useQuery<any[]>({
    queryKey: ['/api/dashboard/activity'],
  });

  const isHR = user?.role === 'hr' || user?.role === 'admin' || user?.role === 'senior_manager';

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value || '0'}</div>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">
                {trend}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your organization today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isHR && (
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees}
            icon={Users}
            color="text-chart-1"
            trend="+2 this month"
          />
        )}
        <StatCard
          title="Present Today"
          value={stats?.presentToday}
          icon={Clock}
          color="text-status-success"
          trend={`${stats?.attendanceRate || 0}% attendance rate`}
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves}
          icon={Calendar}
          color="text-status-warning"
          trend="Needs approval"
        />
        <StatCard
          title="Avg Performance"
          value={stats?.avgPerformance ? `${stats.avgPerformance}/5` : 'N/A'}
          icon={TrendingUp}
          color="text-chart-2"
          trend="This quarter"
        />
        {isHR && (
          <StatCard
            title="Open Positions"
            value={stats?.pendingRecruitments}
            icon={AlertCircle}
            color="text-status-info"
            trend="Active hiring"
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Last 7 days attendance overview</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceTrend ? (
              <Bar
                data={{
                  labels: attendanceTrend.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [
                    {
                      label: 'Present',
                      data: attendanceTrend.present || [45, 48, 50, 47, 49, 20, 15],
                      backgroundColor: 'hsl(142 76% 36%)',
                    },
                    {
                      label: 'Absent',
                      data: attendanceTrend.absent || [5, 2, 0, 3, 1, 0, 0],
                      backgroundColor: 'hsl(0 84% 60%)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
                height={250}
              />
            ) : (
              <Skeleton className="h-[250px] w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
