import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar as CalendarIcon, 
  AlertCircle, 
  CalendarDays, 
  Plus, 
  RotateCw, 
  CheckCircle,
  ClipboardList,
  Wrench,
  Clock,
  ChevronRight,
  Filter
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, isSameMonth, isSameDay, isBefore, isAfter, addDays } from "date-fns";
import { WorkOrderWithDetails, AssetWithDetails } from "@shared/schema";
import PreventiveMaintenanceForm from "./PreventiveMaintenanceForm";

interface ScheduleEvent {
  id: number;
  title: string;
  assetId: number;
  assetNumber: string;
  description: string;
  date: Date;
  status: string; // 'upcoming', 'due', 'overdue', 'completed'
  workOrderId?: number;
}

export default function PreventiveMaintenanceSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  
  // Get work orders and assets
  const { data: workOrders, isLoading: isLoadingWorkOrders } = useQuery<WorkOrderWithDetails[]>({
    queryKey: ['/api/work-orders/details'],
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery<AssetWithDetails[]>({
    queryKey: ['/api/assets/details'],
  });

  // Function to generate preventive maintenance events
  // In a real app, this would come from a PM schedule database table
  const generateMaintenanceSchedule = (): ScheduleEvent[] => {
    if (!assets || !workOrders) return [];
    
    const events: ScheduleEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For each asset that needs preventive maintenance
    assets.forEach(asset => {
      // Skip assets that don't need maintenance
      if (asset.status !== 'operational') return;
      
      // Simulate maintenance interval (e.g., every 30/60/90 days based on asset ID)
      const interval = (asset.id % 3 + 1) * 30; // 30, 60, or 90 days
      
      // Create upcoming maintenance events for the next 6 months
      let nextDate = addDays(today, (asset.id % 14) + 1); // Stagger initial dates
      
      for (let i = 0; i < 3; i++) {
        // See if there's a work order already created for this PM event
        const relatedWorkOrder = workOrders.find(wo => 
          wo.assetId === asset.id && 
          wo.dateNeeded && 
          isSameDay(new Date(wo.dateNeeded), nextDate) &&
          wo.title.includes("Preventive Maintenance")
        );
        
        // Determine status
        let status = 'upcoming';
        if (isSameDay(nextDate, today)) status = 'due';
        else if (isBefore(nextDate, today)) status = 'overdue';
        
        if (relatedWorkOrder?.status === 'completed') status = 'completed';
        
        events.push({
          id: events.length + 1,
          title: `${asset.type?.name || 'Equipment'} Maintenance`,
          assetId: asset.id,
          assetNumber: asset.assetNumber,
          description: asset.description || '',
          date: nextDate,
          status,
          workOrderId: relatedWorkOrder?.id
        });
        
        // Next maintenance date
        nextDate = addDays(nextDate, interval);
      }
    });
    
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  
  const maintenanceEvents = generateMaintenanceSchedule();
  
  // Filter events based on view mode and selected date
  const filteredEvents = maintenanceEvents.filter(event => {
    if (viewMode === 'day') {
      return isSameDay(event.date, selectedDate);
    } else if (viewMode === 'week') {
      // Show events within +/- 3 days of the selected date (1 week)
      const startOfWeek = addDays(selectedDate, -3);
      const endOfWeek = addDays(selectedDate, 3);
      return isAfter(event.date, startOfWeek) && isBefore(event.date, endOfWeek);
    } else {
      // Month view - show all events in the selected month
      return isSameMonth(event.date, selectedDate);
    }
  });
  
  // Count events by status
  const eventCounts = {
    upcoming: maintenanceEvents.filter(e => e.status === 'upcoming').length,
    due: maintenanceEvents.filter(e => e.status === 'due').length,
    overdue: maintenanceEvents.filter(e => e.status === 'overdue').length,
    completed: maintenanceEvents.filter(e => e.status === 'completed').length,
  };
  
  // Helper function to format event dates
  const formatEventDate = (date: Date) => {
    return format(date, "MMM d, yyyy");
  };
  
  // If loading, show skeleton
  if (isLoadingWorkOrders || isLoadingAssets) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-8 w-8 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If assets couldn't be loaded, show error
  if (!assets || !workOrders) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load maintenance data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Preventive Maintenance
          </h2>
          <p className="text-muted-foreground">
            Schedule and track preventive maintenance activities
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Schedule Maintenance
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 text-blue-800 rounded-full p-2 mb-2">
                <CalendarDays className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold">{eventCounts.upcoming}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 text-amber-800 rounded-full p-2 mb-2">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold">{eventCounts.due}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="bg-red-100 text-red-800 rounded-full p-2 mb-2">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold">{eventCounts.overdue}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="bg-green-100 text-green-800 rounded-full p-2 mb-2">
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold">{eventCounts.completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center">
              <ClipboardList className="mr-2 h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'calendar' && (
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'month' ? 'secondary' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button 
                variant={viewMode === 'week' ? 'secondary' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button 
                variant={viewMode === 'day' ? 'secondary' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </div>
          )}
        </div>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <div className="col-span-1 md:col-span-5">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    modifiers={{
                      overdue: (date) => {
                        const events = maintenanceEvents.filter(event => 
                          isSameDay(date, event.date)
                        );
                        return events.some(e => e.status === 'overdue');
                      },
                      due: (date) => {
                        const events = maintenanceEvents.filter(event => 
                          isSameDay(date, event.date)
                        );
                        return events.some(e => e.status === 'due');
                      },
                      scheduled: (date) => {
                        const events = maintenanceEvents.filter(event => 
                          isSameDay(date, event.date)
                        );
                        return events.length > 0;
                      }
                    }}
                    modifiersClassNames={{
                      overdue: 'bg-red-100 text-red-800 font-bold rounded-md',
                      due: 'bg-amber-100 text-amber-800 font-bold rounded-md',
                      scheduled: 'bg-blue-50 font-semibold rounded-md',
                    }}
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <h3 className="font-medium mb-4">
                    Events for {format(selectedDate, "MMM d, yyyy")}
                  </h3>
                  <Separator className="mb-4" />
                  
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                      <Card key={event.id} className="mb-3">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Asset: {event.assetNumber}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                event.status === 'completed' ? 'outline' : 
                                event.status === 'overdue' ? 'destructive' : 
                                event.status === 'due' ? 'secondary' : 'default'
                              }
                            >
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {formatEventDate(event.date)}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        No maintenance events for this period
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Maintenance Schedule</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              <CardDescription>
                Complete list of all scheduled preventive maintenance activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.assetNumber}</TableCell>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>{formatEventDate(event.date)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            event.status === 'completed' ? 'outline' : 
                            event.status === 'overdue' ? 'destructive' : 
                            event.status === 'due' ? 'secondary' : 'default'
                          }
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.workOrderId ? (
                          <Button variant="link" className="p-0 h-auto">
                            {workOrders?.find(wo => wo.id === event.workOrderId)?.workOrderNumber || 'View'}
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Create
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {isFormOpen && (
        <PreventiveMaintenanceForm
          onClose={() => setIsFormOpen(false)}
          onSubmitSuccess={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}