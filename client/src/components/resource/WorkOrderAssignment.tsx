import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WorkOrderWithDetails, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface WorkOrderAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

const statusColors: Record<string, string> = {
  requested: "bg-blue-100 text-blue-800",
  approved: "bg-purple-100 text-purple-800",
  scheduled: "bg-amber-100 text-amber-800",
  in_progress: "bg-orange-100 text-orange-800",
  on_hold: "bg-gray-100 text-gray-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function WorkOrderAssignment({ isOpen, onClose, userId, userName }: WorkOrderAssignmentProps) {
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: workOrders, isLoading } = useQuery<WorkOrderWithDetails[]>({
    queryKey: ['/api/work-orders/details'],
    enabled: isOpen,
  });

  // Filter work orders that can be assigned (not cancelled, not completed)
  const assignableWorkOrders = workOrders?.filter(wo => 
    !wo.assignedToId && 
    wo.status !== 'cancelled' && 
    wo.status !== 'completed'
  ) || [];

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedWorkOrderId(null);
    }
  }, [isOpen]);

  const assignWorkOrderMutation = useMutation({
    mutationFn: async ({ workOrderId, userId }: { workOrderId: number, userId: number }) => {
      return apiRequest(`/api/work-orders/${workOrderId}`, 'PUT', { assignedToId: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      toast({
        title: "Work order assigned",
        description: `Work order has been assigned to ${userName}`,
        variant: "default",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to assign work order",
        description: "There was an error assigning the work order. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAssign = () => {
    if (!selectedWorkOrderId) {
      toast({
        title: "No work order selected",
        description: "Please select a work order to assign",
        variant: "destructive",
      });
      return;
    }

    assignWorkOrderMutation.mutate({ workOrderId: selectedWorkOrderId, userId });
  };

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Not scheduled';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Work Order to {userName}</DialogTitle>
          <DialogDescription>
            Select a work order to assign to this technician.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : assignableWorkOrders.length > 0 ? (
          <div className="py-4">
            <RadioGroup value={selectedWorkOrderId?.toString()} onValueChange={(value) => setSelectedWorkOrderId(Number(value))}>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {assignableWorkOrders.map(workOrder => (
                  <div key={workOrder.id} className="flex items-start space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={workOrder.id.toString()} id={`workorder-${workOrder.id}`} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={`workorder-${workOrder.id}`} className="cursor-pointer flex items-start justify-between">
                        <div>
                          <div className="font-medium">{workOrder.title}</div>
                          <div className="text-sm text-muted-foreground">WO-{workOrder.workOrderNumber}</div>
                          <div className="flex items-center mt-1 gap-2 flex-wrap">
                            <Badge className={statusColors[workOrder.status]}>
                              {workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(workOrder.scheduledDate)}
                            </span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        ) : (
          <div className="py-6 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No work orders available for assignment</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            disabled={!selectedWorkOrderId || assignWorkOrderMutation.isPending} 
            onClick={handleAssign}
          >
            {assignWorkOrderMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Assign Work Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}