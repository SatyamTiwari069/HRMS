import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  BarChart3,
  Briefcase,
  MessageSquare,
  Home,
  Settings,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Employees',
    url: '/employees',
    icon: Users,
    roles: ['admin', 'hr', 'senior_manager'],
  },
  {
    title: 'My Profile',
    url: '/profile',
    icon: Users,
    roles: ['employee'],
  },
  {
    title: 'Attendance',
    url: '/attendance',
    icon: Clock,
  },
  {
    title: 'Leaves',
    url: '/leaves',
    icon: Calendar,
  },
  {
    title: 'Payroll',
    url: '/payroll',
    icon: DollarSign,
  },
  {
    title: 'Performance',
    url: '/performance',
    icon: BarChart3,
  },
  {
    title: 'Recruitment',
    url: '/recruitment',
    icon: Briefcase,
    roles: ['admin', 'hr'],
  },
  {
    title: 'Documents',
    url: '/documents',
    icon: FileText,
  },
  {
    title: 'HR Assistant',
    url: '/chatbot',
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const filteredItems = menuItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">AI HRMS</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || 'User'}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{user?.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            data-testid="button-logout"
            className="h-8 w-8 shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
