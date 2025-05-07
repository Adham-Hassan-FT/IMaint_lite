import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  ClipboardList, 
  Cog, 
  Home, 
  Package, 
  Drill, 
  Truck, 
  Users, 
  Barcode,
  LogOut,
  CalendarDays,
  MessageSquare,
  BarChart,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      // Clear all react-query cache
      queryClient.clear();
      // Reload the page to go back to login
      window.location.href = "/";
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was a problem logging out. Please try again."
      });
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: <Home className="mr-2 h-4 w-4" />,
      path: "/"
    },
    {
      title: "Work Orders",
      icon: <ClipboardList className="mr-2 h-4 w-4" />,
      path: "/work-orders"
    },
    {
      title: "Work Requests",
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      path: "/work-requests"
    },
    {
      title: "Preventive Maintenance",
      icon: <CalendarDays className="mr-2 h-4 w-4" />,
      path: "/maintenance"
    },
    {
      title: "Assets",
      icon: <Drill className="mr-2 h-4 w-4" />,
      path: "/assets"
    },
    {
      title: "Inventory",
      icon: <Package className="mr-2 h-4 w-4" />,
      path: "/inventory"
    },
    {
      title: "Resources",
      icon: <Users className="mr-2 h-4 w-4" />,
      path: "/resources"
    },
    {
      title: "Reports",
      icon: <BarChart className="mr-2 h-4 w-4" />,
      path: "/reports"
    },
    {
      title: "Barcode Scanner",
      icon: <Barcode className="mr-2 h-4 w-4" />,
      path: "/scanner"
    }
  ];

  return (
    <div className={cn("pb-8 w-full md:w-64 bg-slate-50 border-r h-screen overflow-y-auto", className)}>
      <div className="space-y-3 md:space-y-4 py-3 md:py-4">
        <div className="px-3 md:px-4 py-1 md:py-2">
          <h2 className="text-lg md:text-xl font-bold tracking-tight flex items-center">
            <Cog className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" />
            IMaint Lite
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Maintenance Management
          </p>
        </div>
        <Separator />
        <div className="px-2 md:px-3 py-1 md:py-2">
          <nav className="space-y-0.5 md:space-y-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-xs md:text-sm h-9 md:h-10",
                    location === item.path
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        <Separator />
        <div className="px-2 md:px-3 py-1 md:py-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-xs md:text-sm h-9 md:h-10 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
