import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WorkOrderWithDetails, workOrderStatusEnum } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ClipboardList,
  CalendarClock,
  User,
  Wrench,
  DollarSign,
  Clock,
  CheckCircle,
  RotateCw,
  AlertCircle,
  Plus,
  Drill,
  Package,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import WorkOrderLaborForm from "./WorkOrderLaborForm";
import WorkOrderPartForm from "./WorkOrderPartForm";

const statusColors: Record<string, string> = {
  requested: "bg-blue-100 text-blue-800",
  approved: "bg-purple-100 text-purple-800",
  scheduled: "bg-amber-100 text-amber-800",
  in_progress: "bg-orange-100 text-orange-800",
  on_hold: "bg-gray-100 text-gray-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
};

interface WorkOrderDetailsProps {
  workOrder: WorkOrderWithDetails;
  onClose: () => void;
}

export default function WorkOrderDetails({ workOrder, onClose }: WorkOrderDetailsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isLaborFormOpen, setIsLaborFormOpen] = useState(false);
  const [isPartFormOpen, setIsPartFormOpen] = useState(false);

  // Get fresh data for the work order
  const { data: refreshedWorkOrder, isLoading } = useQuery<WorkOrderWithDetails>({
    queryKey: [`/api/work-orders/${workOrder.id}/details`],
    initialData: workOrder,
  });

  // Format dates for display
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Not specified';
    const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(dateObj, 'MMM d, yyyy');
  };
  
  // Calculate total labor hours - ensure numeric values
  const totalLaborHours: number = refreshedWorkOrder.laborEntries?.reduce(
    (sum: number, entry) => sum + Number(entry.hours), 
    0
  ) || 0;
  
  // Calculate total parts cost - ensure numeric values
  const totalPartsCost: number = refreshedWorkOrder.parts?.reduce(
    (sum: number, part) => sum + (part.quantity * Number(part.inventoryItem?.unitCost || 0)), 
    0
  ) || 0;

  // Handle print functionality
  const handlePrint = () => {
    // Create a printable version of the work order
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="font-size: 20px; text-align: center; margin-bottom: 20px;">WORK ORDER: ${refreshedWorkOrder.workOrderNumber}</h1>
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; margin-bottom: 10px;">${refreshedWorkOrder.title}</h2>
          <div style="margin-bottom: 10px;">
            <strong>Status:</strong> ${refreshedWorkOrder.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Priority:</strong> ${refreshedWorkOrder.priority.charAt(0).toUpperCase() + refreshedWorkOrder.priority.slice(1)}
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Description:</strong> ${refreshedWorkOrder.description || 'N/A'}
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin-bottom: 10px;">Time Information</h3>
          <div><strong>Date Requested:</strong> ${formatDate(refreshedWorkOrder.dateRequested)}</div>
          <div><strong>Date Needed:</strong> ${formatDate(refreshedWorkOrder.dateNeeded)}</div>
          <div><strong>Date Completed:</strong> ${formatDate(refreshedWorkOrder.dateCompleted)}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin-bottom: 10px;">Asset Information</h3>
          <div><strong>Asset Number:</strong> ${refreshedWorkOrder.asset?.assetNumber || 'N/A'}</div>
          <div><strong>Description:</strong> ${refreshedWorkOrder.asset?.description || 'N/A'}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin-bottom: 10px;">Personnel</h3>
          <div><strong>Requested By:</strong> ${refreshedWorkOrder.requestedBy?.fullName || 'N/A'}</div>
          <div><strong>Assigned To:</strong> ${refreshedWorkOrder.assignedTo?.fullName || 'N/A'}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin-bottom: 10px;">Labor</h3>
          ${refreshedWorkOrder.laborEntries && refreshedWorkOrder.laborEntries.length > 0 
            ? `<table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid #ccc;">
                    <th style="text-align: left; padding: 8px;">Technician</th>
                    <th style="text-align: left; padding: 8px;">Date</th>
                    <th style="text-align: left; padding: 8px;">Hours</th>
                    <th style="text-align: left; padding: 8px;">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${refreshedWorkOrder.laborEntries.map(labor => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px;">${labor.userId ? refreshedWorkOrder.assignedTo?.fullName || 'Unknown' : 'Not assigned'}</td>
                      <td style="padding: 8px;">${formatDate(labor.datePerformed)}</td>
                      <td style="padding: 8px;">${labor.hours}</td>
                      <td style="padding: 8px;">${labor.notes || '-'}</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td style="padding: 8px; font-weight: bold;" colspan="2">Total Hours:</td>
                    <td style="padding: 8px; font-weight: bold;">${totalLaborHours}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>`
            : '<div>No labor entries recorded.</div>'
          }
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin-bottom: 10px;">Parts</h3>
          ${refreshedWorkOrder.parts && refreshedWorkOrder.parts.length > 0 
            ? `<table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid #ccc;">
                    <th style="text-align: left; padding: 8px;">Part Number</th>
                    <th style="text-align: left; padding: 8px;">Name</th>
                    <th style="text-align: left; padding: 8px;">Quantity</th>
                    <th style="text-align: right; padding: 8px;">Unit Cost</th>
                    <th style="text-align: right; padding: 8px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${refreshedWorkOrder.parts.map(part => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px;">${part.inventoryItem?.partNumber || 'Unknown'}</td>
                      <td style="padding: 8px;">${part.inventoryItem?.name || 'Unknown Part'}</td>
                      <td style="padding: 8px;">${part.quantity}</td>
                      <td style="padding: 8px; text-align: right;">$${Number(part.inventoryItem?.unitCost || 0).toFixed(2)}</td>
                      <td style="padding: 8px; text-align: right;">$${(part.quantity * Number(part.inventoryItem?.unitCost || 0)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td style="padding: 8px; font-weight: bold;" colspan="4">Total Cost:</td>
                    <td style="padding: 8px; font-weight: bold; text-align: right;">$${totalPartsCost.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>`
            : '<div>No parts recorded.</div>'
          }
        </div>
      </div>
    `;
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Work Order ${refreshedWorkOrder.workOrderNumber}</title>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              // Auto-print when loaded
              window.onload = function() {
                window.print();
                // The following timeout is to prevent the window from closing before print dialog shows up
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast({
        variant: "destructive",
        title: "Print Error",
        description: "Unable to open print window. Please check your popup blocker settings.",
      });
    }
  };

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PUT", `/api/work-orders/${workOrder.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/details`] });
      toast({
        title: "Status Updated",
        description: "Work order status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  // Calculate status transitions based on current status
  const getAvailableStatusTransitions = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      requested: ["approved", "cancelled"],
      approved: ["scheduled", "cancelled", "on_hold"],
      scheduled: ["in_progress", "on_hold", "cancelled"],
      in_progress: ["completed", "on_hold"],
      on_hold: ["in_progress", "cancelled"],
      completed: [],
      cancelled: ["requested"],
    };
    
    return transitions[currentStatus] || [];
  };

  const availableTransitions = getAvailableStatusTransitions(refreshedWorkOrder.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={onClose} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Work Order Details</h2>
        <div className="ml-auto flex gap-2">
          {availableTransitions.map(status => (
            <Button 
              key={status} 
              size="sm"
              variant="outline"
              className="flex items-center"
              onClick={() => handleStatusChange(status)}
              disabled={updateStatusMutation.isPending}
            >
              {status === "approved" && <CheckCircle className="h-4 w-4 mr-1" />}
              {status === "scheduled" && <CalendarClock className="h-4 w-4 mr-1" />}
              {status === "in_progress" && <RotateCw className="h-4 w-4 mr-1" />}
              {status === "completed" && <CheckCircle className="h-4 w-4 mr-1" />}
              {status === "on_hold" && <AlertCircle className="h-4 w-4 mr-1" />}
              {status === "cancelled" && <AlertCircle className="h-4 w-4 mr-1" />}
              {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="labor">Labor</TabsTrigger>
          <TabsTrigger value="parts">Parts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <ClipboardList className="h-5 w-5 mr-2 text-primary" />
                        <CardTitle className="text-2xl">{refreshedWorkOrder.workOrderNumber}</CardTitle>
                      </div>
                      <CardDescription className="text-lg">
                        {refreshedWorkOrder.title}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={priorityColors[refreshedWorkOrder.priority]}>
                        {refreshedWorkOrder.priority.charAt(0).toUpperCase() + refreshedWorkOrder.priority.slice(1)} Priority
                      </Badge>
                      <Badge className={statusColors[refreshedWorkOrder.status]}>
                        {refreshedWorkOrder.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm">{refreshedWorkOrder.description}</p>
                  </div>
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                          Time Information
                        </h3>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Date Requested:</dt>
                            <dd>{formatDate(refreshedWorkOrder.dateRequested)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Date Needed:</dt>
                            <dd>{formatDate(refreshedWorkOrder.dateNeeded)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Date Completed:</dt>
                            <dd>{formatDate(refreshedWorkOrder.dateCompleted)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Estimated Hours:</dt>
                            <dd>{refreshedWorkOrder.estimatedHours || 'Not specified'}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                          Cost Information
                        </h3>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Estimated Cost:</dt>
                            <dd>${refreshedWorkOrder.estimatedCost 
                                  ? Number(refreshedWorkOrder.estimatedCost).toFixed(2) 
                                  : '0.00'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Labor Cost:</dt>
                            <dd>${(totalLaborHours * 75).toFixed(2)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Parts Cost:</dt>
                            <dd>${totalPartsCost.toFixed(2)}</dd>
                          </div>
                          <div className="flex justify-between font-medium">
                            <dt className="text-muted-foreground">Total Cost:</dt>
                            <dd>${((totalLaborHours * 75) + totalPartsCost).toFixed(2)}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          Personnel
                        </h3>
                        <dl className="space-y-4 text-sm">
                          <div className="flex items-center">
                            <dt className="text-muted-foreground w-1/2">Requested By:</dt>
                            <dd className="flex items-center">
                              {refreshedWorkOrder.requestedBy ? (
                                <>
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarFallback className="text-xs">
                                      {refreshedWorkOrder.requestedBy.fullName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {refreshedWorkOrder.requestedBy.fullName}
                                </>
                              ) : (
                                'Not assigned'
                              )}
                            </dd>
                          </div>
                          <div className="flex items-center">
                            <dt className="text-muted-foreground w-1/2">Assigned To:</dt>
                            <dd className="flex items-center">
                              {refreshedWorkOrder.assignedTo ? (
                                <>
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarFallback className="text-xs">
                                      {refreshedWorkOrder.assignedTo.fullName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {refreshedWorkOrder.assignedTo.fullName}
                                </>
                              ) : (
                                'Not assigned'
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <Drill className="h-4 w-4 mr-2 text-muted-foreground" />
                          Asset Information
                        </h3>
                        {refreshedWorkOrder.asset ? (
                          <Card className="bg-muted/30 border-dashed">
                            <CardHeader className="p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <CardTitle className="text-sm">{refreshedWorkOrder.asset.assetNumber}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {refreshedWorkOrder.asset.description}
                                  </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                          </Card>
                        ) : (
                          <p className="text-sm text-muted-foreground">No asset assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Work Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-blue-700">Type</h3>
                        <Wrench className="h-4 w-4 text-blue-700" />
                      </div>
                      <p className="text-xl font-bold text-blue-900">
                        {refreshedWorkOrder.type?.name || 'Not specified'}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        {refreshedWorkOrder.type?.description || ''}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-amber-50 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-medium text-amber-700 text-sm">Labor</h3>
                          <Clock className="h-3 w-3 text-amber-700" />
                        </div>
                        <p className="text-lg font-bold text-amber-900">
                          {totalLaborHours} <span className="text-sm font-normal">hrs</span>
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-medium text-green-700 text-sm">Parts</h3>
                          <Package className="h-3 w-3 text-green-700" />
                        </div>
                        <p className="text-lg font-bold text-green-900">
                          {refreshedWorkOrder.parts?.length || 0}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Status History</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-sm">Requested</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(refreshedWorkOrder.dateRequested)}
                          </span>
                        </div>
                        {refreshedWorkOrder.status === "approved" || 
                         refreshedWorkOrder.status === "scheduled" || 
                         refreshedWorkOrder.status === "in_progress" || 
                         refreshedWorkOrder.status === "completed" ? (
                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded-md">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-purple-600 mr-2"></div>
                              <span className="text-sm">Approved</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(new Date())}
                            </span>
                          </div>
                        ) : null}
                        {refreshedWorkOrder.status === "completed" && (
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded-md">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                              <span className="text-sm">Completed</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(refreshedWorkOrder.dateCompleted)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={handlePrint}>Print Work Order</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="labor" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Labor Entries</CardTitle>
                <Button onClick={() => setIsLaborFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Labor
                </Button>
              </div>
              <CardDescription>Track technician time spent on this work order</CardDescription>
            </CardHeader>
            <CardContent>
              {refreshedWorkOrder.laborEntries && refreshedWorkOrder.laborEntries.length > 0 ? (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 text-sm font-medium">Technician</th>
                        <th className="text-left p-3 text-sm font-medium">Date</th>
                        <th className="text-left p-3 text-sm font-medium">Hours</th>
                        <th className="text-left p-3 text-sm font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refreshedWorkOrder.laborEntries.map((labor) => (
                        <tr key={labor.id} className="border-b last:border-0">
                          <td className="p-3 text-sm">
                            {labor.userId ? 
                              refreshedWorkOrder.assignedTo?.fullName || 'Unknown' : 
                              'Not assigned'}
                          </td>
                          <td className="p-3 text-sm">
                            {formatDate(labor.datePerformed)}
                          </td>
                          <td className="p-3 text-sm font-medium">
                            {labor.hours}
                          </td>
                          <td className="p-3 text-sm">
                            {labor.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/20">
                        <td className="p-3 text-sm font-medium" colSpan={2}>Total Hours:</td>
                        <td className="p-3 text-sm font-bold">{totalLaborHours}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No labor entries</h3>
                  <p className="text-muted-foreground mt-2">
                    Start tracking time by adding labor entries.
                  </p>
                  <Button className="mt-4" onClick={() => setIsLaborFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Labor Entry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {isLaborFormOpen && (
            <WorkOrderLaborForm 
              workOrderId={refreshedWorkOrder.id} 
              onClose={() => setIsLaborFormOpen(false)}
              onSubmitSuccess={() => setIsLaborFormOpen(false)}
            />
          )}
        </TabsContent>
        
        <TabsContent value="parts" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Parts Used</CardTitle>
                <Button onClick={() => setIsPartFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              </div>
              <CardDescription>Track inventory parts used for this work order</CardDescription>
            </CardHeader>
            <CardContent>
              {refreshedWorkOrder.parts && refreshedWorkOrder.parts.length > 0 ? (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 text-sm font-medium">Part Number</th>
                        <th className="text-left p-3 text-sm font-medium">Name</th>
                        <th className="text-left p-3 text-sm font-medium">Quantity</th>
                        <th className="text-right p-3 text-sm font-medium">Unit Cost</th>
                        <th className="text-right p-3 text-sm font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refreshedWorkOrder.parts.map((part) => (
                        <tr key={part.id} className="border-b last:border-0">
                          <td className="p-3 text-sm font-medium">
                            {part.inventoryItem?.partNumber || 'Unknown'}
                          </td>
                          <td className="p-3 text-sm">
                            {part.inventoryItem?.name || 'Unknown Part'}
                          </td>
                          <td className="p-3 text-sm">
                            {part.quantity}
                          </td>
                          <td className="p-3 text-sm text-right">
                            ${Number(part.inventoryItem?.unitCost || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-sm font-medium text-right">
                            ${(part.quantity * Number(part.inventoryItem?.unitCost || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/20">
                        <td className="p-3 text-sm font-medium" colSpan={4}>Total Cost:</td>
                        <td className="p-3 text-sm font-bold text-right">
                          ${totalPartsCost.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No parts used</h3>
                  <p className="text-muted-foreground mt-2">
                    Add parts that were used on this work order.
                  </p>
                  <Button className="mt-4" onClick={() => setIsPartFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Part
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {isPartFormOpen && (
            <WorkOrderPartForm 
              workOrderId={refreshedWorkOrder.id} 
              onClose={() => setIsPartFormOpen(false)}
              onSubmitSuccess={() => setIsPartFormOpen(false)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}