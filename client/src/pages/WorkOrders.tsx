import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WorkOrderList from "@/components/workorder/WorkOrderList";
import WorkOrderDetails from "@/components/workorder/WorkOrderDetails";
import { WorkOrderWithDetails } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function WorkOrders() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const workOrderId = params?.id ? parseInt(params.id) : null;
  
  // If we have a workOrderId, fetch that specific work order
  const { data: workOrder, isLoading, isError } = useQuery<WorkOrderWithDetails>({
    queryKey: [`/api/work-orders/${workOrderId}/details`],
    enabled: !!workOrderId,
    retry: 1, // Only retry once to prevent infinite loading on non-existent IDs
  });
  
  const handleClose = () => {
    setLocation("/work-orders");
  };
  
  if (workOrderId) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (isError || !workOrder) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load work order. It may not exist or has been deleted.
          </AlertDescription>
          <div className="mt-4">
            <button 
              className="text-blue-500 hover:text-blue-700 underline"
              onClick={() => setLocation("/work-orders")}
            >
              Return to work orders
            </button>
          </div>
        </Alert>
      );
    }
    
    return <WorkOrderDetails workOrder={workOrder} onClose={handleClose} />;
  }
  
  // If no id parameter, show the list view
  return <WorkOrderList />;
}
