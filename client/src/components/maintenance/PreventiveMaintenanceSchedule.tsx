import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

// Create a function to get the CSS class for each event status
const getEventStatusClass = (status: string): string => {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800';
    case 'due':
      return 'bg-amber-100 text-amber-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return '';
  }
};

export default function PreventiveMaintenanceSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Create work order mutation - moved up to avoid conditional hook error
  const createWorkOrderMutation = useMutation({
    mutationFn: async (event: ScheduleEvent) => {
      // Create a work order from the maintenance event
      const workOrderData = {
        title: event.title,
        description: event.description,
        assetId: event.assetId,
        priority: "medium",
        status: "requested",
        dateNeeded: event.date
      };
      
      const response = await apiRequest("POST", "/api/work-orders", workOrderData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      toast({
        title: "Work Order Created",
        description: "The work order was created successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create work order",
        description: error.message || "An unexpected error occurred"
      });
    }
  });
  
  // Get preventive maintenance schedules, work orders, and assets
  const { data: preventiveMaintenance, isLoading: isLoadingPM } = useQuery({
    queryKey: ['/api/preventive-maintenance/details'],
  });

  const { data: workOrders, isLoading: isLoadingWorkOrders } = useQuery<WorkOrderWithDetails[]>({
    queryKey: ['/api/work-orders/details'],
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery<AssetWithDetails[]>({
    queryKey: ['/api/assets/details'],
  });

  // Function to generate maintenance events from the PM schedules and their generated work orders
  const generateMaintenanceSchedule = (): ScheduleEvent[] => {
    if (!preventiveMaintenance || !workOrders || !assets) return [];
    
    const events: ScheduleEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Process each PM schedule
    (preventiveMaintenance as any[]).forEach((pm: any) => {
      // Skip inactive PMs
      if (!pm.isActive) return;
      
      // Get the asset info
      const asset = pm.asset || assets.find(a => a.id === pm.assetId);
      if (!asset && pm.assetId) return; // Skip if asset not found but required
      
      // For each work order generated from this PM
      if (pm.generatedWorkOrders && pm.generatedWorkOrders.length > 0) {
        pm.generatedWorkOrders.forEach((pmwo: any) => {
          const workOrder = pmwo.workOrder;
          if (!workOrder) return;
          
          // Convert date strings to Date objects
          const scheduledDate = pmwo.scheduledDate ? new Date(pmwo.scheduledDate) : null;
          if (!scheduledDate) return;
          
          // Determine status
          let status = 'upcoming';
          if (isSameDay(scheduledDate, today)) status = 'due';
          else if (isBefore(scheduledDate, today)) status = 'overdue';
          
          if (workOrder.status === 'completed') status = 'completed';
          
          events.push({
            id: workOrder.id,
            title: `${asset?.type?.name || 'Equipment'} Maintenance`,
            assetId: asset?.id || 0,
            assetNumber: asset?.assetNumber || 'N/A',
            description: pm.title || pm.description || '',
            date: scheduledDate,
            status,
            workOrderId: workOrder.id
          });
        });
      } 
      // If no work orders yet, create an event for the PM itself
      else {
        const startDate = pm.startDate ? new Date(pm.startDate) : null;
        if (!startDate) return;
        
        // Determine status
        let status = 'upcoming';
        if (isSameDay(startDate, today)) status = 'due';
        else if (isBefore(startDate, today)) status = 'overdue';
        
        events.push({
          id: pm.id,
          title: `${asset?.type?.name || 'Equipment'} Maintenance`,
          assetId: asset?.id || 0,
          assetNumber: asset?.assetNumber || 'N/A',
          description: pm.title || pm.description || '',
          date: startDate,
          status
        });
        
        // For recurring PM, add future occurrences
        if (pm.isRecurring && pm.recurringPeriod && pm.occurrences) {
          for (let i = 1; i < pm.occurrences; i++) {
            let futureDate = new Date(startDate);
            
            // Calculate the future date based on recurring period
            switch (pm.recurringPeriod) {
              case 'daily':
                futureDate.setDate(futureDate.getDate() + i);
                break;
              case 'weekly':
                futureDate.setDate(futureDate.getDate() + (i * 7));
                break;
              case 'biweekly':
                futureDate.setDate(futureDate.getDate() + (i * 14));
                break;
              case 'monthly':
                futureDate.setMonth(futureDate.getMonth() + i);
                break;
              case 'quarterly':
                futureDate.setMonth(futureDate.getMonth() + (i * 3));
                break;
              case 'semiannually':
                futureDate.setMonth(futureDate.getMonth() + (i * 6));
                break;
              case 'annually':
                futureDate.setFullYear(futureDate.getFullYear() + i);
                break;
            }
            
            events.push({
              id: pm.id * 1000 + i, // Create a unique ID
              title: `${asset?.type?.name || 'Equipment'} Maintenance`,
              assetId: asset?.id || 0,
              assetNumber: asset?.assetNumber || 'N/A',
              description: `${pm.title || pm.description || ''} (${i+1}/${pm.occurrences})`,
              date: futureDate,
              status: 'upcoming'
            });
          }
        }
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
  if (isLoadingWorkOrders || isLoadingAssets || isLoadingPM) {
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
  
  // If data couldn't be loaded, show error
  if (!assets || !workOrders || !preventiveMaintenance) {
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
  
  // Handler for filtering events
  const handleFilterClick = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  // Apply filter for events by status
  const filteredByStatusEvents = filterStatus 
    ? filteredEvents.filter(event => event.status === filterStatus)
    : filteredEvents;
  
  // Handle viewing a work order
  const handleViewWorkOrder = (event: ScheduleEvent) => {
    if (event.workOrderId) {
      setLocation(`/work-orders/${event.workOrderId}`);
    }
  };
  
  // Handle creating a work order from an event
  const handleCreateWorkOrder = (event: ScheduleEvent) => {
    createWorkOrderMutation.mutate(event);
  };
  
  // Handle viewing event details
  const handleViewDetails = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };
  
  // List tab implementation
  const renderListTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Maintenance Schedule</h2>
          
          <div className="flex items-center gap-2">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleFilterClick}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter by Status</h4>
                  <div className="grid gap-2">
                    <Button 
                      variant={filterStatus === null ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilterStatus(null)}
                    >
                      All
                    </Button>
                    <Button 
                      variant={filterStatus === "upcoming" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilterStatus("upcoming")}
                    >
                      Upcoming
                    </Button>
                    <Button 
                      variant={filterStatus === "due" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilterStatus("due")}
                    >
                      Due Today
                    </Button>
                    <Button 
                      variant={filterStatus === "overdue" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilterStatus("overdue")}
                    >
                      Overdue
                    </Button>
                    <Button 
                      variant={filterStatus === "completed" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilterStatus("completed")}
                    >
                      Completed
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Maintenance Type</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredByStatusEvents.length > 0 ? (
              filteredByStatusEvents.map(event => (
                <TableRow key={event.id}>
                  <TableCell>{event.assetNumber}</TableCell>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{formatEventDate(event.date)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getEventStatusClass(event.status)}
                    >
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(event)}>
                        Details
                      </Button>
                      
                      {event.workOrderId ? (
                        <Button size="sm" variant="default" onClick={() => handleViewWorkOrder(event)}>
                          View Work Order
                        </Button>
                      ) : (
                        <Button size="sm" variant="default" onClick={() => handleCreateWorkOrder(event)}>
                          Create Work Order
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No scheduled maintenance for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Event details dialog
  const renderEventDetailsDialog = () => {
    if (!selectedEvent) return null;
    
    return (
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Maintenance Details</DialogTitle>
            <DialogDescription>
              Details for the scheduled maintenance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Title</h4>
              <p className="mt-1">{selectedEvent.title}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Asset</h4>
              <p className="mt-1">{selectedEvent.assetNumber}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
              <p className="mt-1">{selectedEvent.description}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Scheduled Date</h4>
              <p className="mt-1">{formatEventDate(selectedEvent.date)}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
              <Badge 
                variant="outline" 
                className={getEventStatusClass(selectedEvent.status)}
              >
                {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEventDetails(false)}>
              Close
            </Button>
            
            {selectedEvent.workOrderId ? (
              <Button onClick={() => {
                handleViewWorkOrder(selectedEvent);
                setShowEventDetails(false);
              }}>
                View Work Order
              </Button>
            ) : (
              <Button onClick={() => {
                handleCreateWorkOrder(selectedEvent);
                setShowEventDetails(false);
              }}>
                Create Work Order
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
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
          {renderListTab()}
        </TabsContent>
      </Tabs>
      
      {renderEventDetailsDialog()}
      
      {isFormOpen && (
        <PreventiveMaintenanceForm
          onClose={() => setIsFormOpen(false)}
          onSubmitSuccess={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}