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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Drill, ClipboardList, User, Clock, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const [status, setStatus] = useState(workOrder.status);

  // Get fresh data for the work order
  const { data: refreshedWorkOrder, isLoading } = useQuery<WorkOrderWithDetails>({
    queryKey: [`/api/work-orders/${workOrder.id}/details`],
    initialData: workOrder
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PUT", `/api/work-orders/${workOrder.id}`, { status: newStatus });
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
      // Reset status to the current value
      setStatus(workOrder.status);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={onClose} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Work Order Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{refreshedWorkOrder.workOrderNumber}</CardTitle>
                  <CardDescription className="text-lg font-medium mt-1">
                    {refreshedWorkOrder.title}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={priorityColors[refreshedWorkOrder.priority] || ""}>
                    {refreshedWorkOrder.priority.charAt(0).toUpperCase() + refreshedWorkOrder.priority.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground mr-2">Status:</span>
                  <Badge className={statusColors[refreshedWorkOrder.status] || ""}>
                    {refreshedWorkOrder.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Badge>
                </div>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    {workOrderStatusEnum.enumValues.map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {statusOption.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm">{refreshedWorkOrder.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Drill className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Asset:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedWorkOrder.asset?.description || 'None assigned'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Type:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedWorkOrder.type?.name || 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Requested by:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedWorkOrder.requestedBy?.fullName || 'Unknown'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Assigned to:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedWorkOrder.assignedTo?.fullName || 'Not assigned'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Date requested:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedWorkOrder.dateRequested ? format(new Date(refreshedWorkOrder.dateRequested), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Date needed:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedWorkOrder.dateNeeded ? format(new Date(refreshedWorkOrder.dateNeeded), 'MMM d, yyyy') : 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Estimated hours:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedWorkOrder.estimatedHours || 'Not estimated'} {refreshedWorkOrder.estimatedHours ? 'hours' : ''}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Estimated cost:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedWorkOrder.estimatedCost ? `$${refreshedWorkOrder.estimatedCost.toFixed(2)}` : 'Not estimated'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="ml-auto">Edit Work Order</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="labor">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="labor">Labor</TabsTrigger>
                  <TabsTrigger value="parts">Parts</TabsTrigger>
                </TabsList>
                <TabsContent value="labor" className="pt-4">
                  {refreshedWorkOrder.laborEntries && refreshedWorkOrder.laborEntries.length > 0 ? (
                    <div className="space-y-3">
                      {refreshedWorkOrder.laborEntries.map((labor) => (
                        <div key={labor.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{labor.hours} hours</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(labor.datePerformed), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <p className="text-sm font-medium">
                              ${labor.laborCost ? labor.laborCost.toFixed(2) : '0.00'}
                            </p>
                          </div>
                          {labor.notes && <p className="text-sm mt-2">{labor.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">No labor entries recorded</p>
                      <Button className="mt-2" variant="outline">Add Labor</Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="parts" className="pt-4">
                  {refreshedWorkOrder.parts && refreshedWorkOrder.parts.length > 0 ? (
                    <div className="space-y-3">
                      {refreshedWorkOrder.parts.map((part) => (
                        <div key={part.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{part.inventoryItem?.name || 'Unknown Part'}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {part.quantity} x ${part.unitCost ? part.unitCost.toFixed(2) : '0.00'}
                              </p>
                            </div>
                            <p className="text-sm font-medium">
                              ${part.totalCost ? part.totalCost.toFixed(2) : '0.00'}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Issued: {format(new Date(part.dateIssued), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">No parts used</p>
                      <Button className="mt-2" variant="outline">Add Parts</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Total Cost: 
                <span className="font-bold ml-2">
                  $
                  {(
                    (refreshedWorkOrder.actualCost || 0) + 
                    (refreshedWorkOrder.parts?.reduce((sum, part) => sum + (part.totalCost || 0), 0) || 0)
                  ).toFixed(2)}
                </span>
              </div>
              <Button variant="outline" size="sm">Add Resource</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
