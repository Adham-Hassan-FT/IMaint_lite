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
  const getFilteredEvents = () => {
    if (viewMode === 'month') {
      return maintenanceEvents.filter(event => 
        isSameMonth(event.date, selectedDate)
      );
    } else if (viewMode === 'week') {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
      
      return maintenanceEvents.filter(event => 
        (isAfter(event.date, weekStart) || isSameDay(event.date, weekStart)) && 
        (isBefore(event.date, weekEnd) || isSameDay(event.date, weekEnd))
      );
    } else {
      return maintenanceEvents.filter(event => 
        isSameDay(event.date, selectedDate)
      );
    }
  };
  
  const filteredEvents = getFilteredEvents();
  
  // Count events by status
  const eventCounts = {
    upcoming: maintenanceEvents.filter(e => e.status === 'upcoming').length,
    due: maintenanceEvents.filter(e => e.status === 'due').length,
    overdue: maintenanceEvents.filter(e => e.status === 'overdue').length,
    completed: maintenanceEvents.filter(e => e.status === 'completed').length,
  };
  
  // Date formatter
  const formatEventDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  if (isLoadingWorkOrders || isLoadingAssets) {
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
          <Skeleton className="h-10 w-[150px]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-10 rounded-full mx-auto mb-2" />
                <Skeleton className="h-6 w-8 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
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
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          {activeTab === "calendar" && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode("month")}
                className={viewMode === "month" ? "bg-muted" : ""}
              >
                Month
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode("week")}
                className={viewMode === "week" ? "bg-muted" : ""}
              >
                Week
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode("day")}
                className={viewMode === "day" ? "bg-muted" : ""}
              >
                Day
              </Button>
            </div>
          )}
        </div>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{format(selectedDate, 'MMMM yyyy')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedDate(prev => {
                      const newDate = new Date(prev);
                      if (viewMode === 'month') {
                        newDate.setMonth(newDate.getMonth() - 1);
                      } else if (viewMode === 'week') {
                        newDate.setDate(newDate.getDate() - 7);
                      } else {
                        newDate.setDate(newDate.getDate() - 1);
                      }
                      return newDate;
                    })}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedDate(prev => {
                      const newDate = new Date(prev);
                      if (viewMode === 'month') {
                        newDate.setMonth(newDate.getMonth() + 1);
                      } else if (viewMode === 'week') {
                        newDate.setDate(newDate.getDate() + 7);
                      } else {
                        newDate.setDate(newDate.getDate() + 1);
                      }
                      return newDate;
                    })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="w-full lg:w-7/12">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    components={{
                      Day: ({ day, ...props }) => {
                        // Check if there are maintenance events on this day
                        const events = maintenanceEvents.filter(event => 
                          isSameDay(day.date, event.date)
                        );
                        
                        // Determine if this day has important events
                        const hasDue = events.some(e => e.status === 'due');
                        const hasOverdue = events.some(e => e.status === 'overdue');
                        
                        return (
                          <div
                            {...props}
                            className={`relative ${props.className} ${
                              events.length > 0 ? 'font-bold' : ''
                            }`}
                          >
                            {day.date.getDate()}
                            {events.length > 0 && (
                              <div 
                                className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-1 rounded-full ${
                                  hasOverdue ? 'bg-red-500' : 
                                  hasDue ? 'bg-amber-500' : 'bg-blue-500'
                                }`} 
                              />
                            )}
                          </div>
                        );
                      },
                    }}
                  />
                </div>
                
                <div className="hidden lg:block lg:w-5/12 border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">
                      Events for {format(selectedDate, 'MMMM d, yyyy')}
                    </h3>
                    <Badge variant="outline">
                      {viewMode === 'month' ? 'Month' : viewMode === 'week' ? 'Week' : 'Day'} View
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map(event => (
                        <Card key={event.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-3">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{event.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Asset: {event.assetNumber}
                                </p>
                              </div>
                              <Badge 
                                className={
                                  event.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                  event.status === 'due' ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                                }
                              >
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-xs mt-1 text-muted-foreground">
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
              </div>
              
              <div className="block lg:hidden mt-4">
                <h3 className="font-medium mb-2">
                  Events for {format(selectedDate, viewMode === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
                </h3>
                
                <div className="space-y-2">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                      <Card key={event.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-3">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Asset: {event.assetNumber}
                              </p>
                            </div>
                            <Badge 
                              className={
                                event.status === 'completed' ? 'bg-green-100 text-green-800' :
                                event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                event.status === 'due' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              }
                            >
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs mt-1 text-muted-foreground">
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
                    <TableHead>Date</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Maintenance Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {formatEventDate(event.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{event.assetNumber}</span>
                          <span className="text-xs text-muted-foreground">{event.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            event.status === 'completed' ? 'bg-green-100 text-green-800' :
                            event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            event.status === 'due' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
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