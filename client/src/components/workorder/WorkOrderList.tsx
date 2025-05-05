import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkOrderWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MoreVertical, Plus, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import WorkOrderForm from "./WorkOrderForm";
import WorkOrderDetails from "./WorkOrderDetails";

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

export default function WorkOrderList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: workOrders, isLoading, isError } = useQuery<WorkOrderWithDetails[]>({
    queryKey: ['/api/work-orders/details'],
  });

  const filteredWorkOrders = workOrders?.filter(workOrder => {
    if (activeTab === "all") return true;
    if (activeTab === "open") {
      return ["requested", "approved", "scheduled", "in_progress"].includes(workOrder.status);
    }
    if (activeTab === "scheduled") return workOrder.status === "scheduled";
    if (activeTab === "completed") return workOrder.status === "completed";
    return true;
  });

  const handleViewDetails = (workOrder: WorkOrderWithDetails) => {
    setSelectedWorkOrder(workOrder);
  };

  const handleCloseDetails = () => {
    setSelectedWorkOrder(null);
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load work orders. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {selectedWorkOrder ? (
        <WorkOrderDetails workOrder={selectedWorkOrder} onClose={handleCloseDetails} />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Work Orders
              </h2>
              <p className="text-muted-foreground">
                Manage and track maintenance work orders
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Work Order
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-8 w-20" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredWorkOrders && filteredWorkOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWorkOrders.map((workOrder) => (
                    <Card key={workOrder.id} className="hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{workOrder.workOrderNumber}</CardTitle>
                            <CardDescription>{workOrder.title}</CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(workOrder)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Asset:</span>
                            <span>{workOrder.asset?.description || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Requested by:</span>
                            <span>{workOrder.requestedBy?.fullName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Date needed:</span>
                            <span>
                              {workOrder.dateNeeded ? format(new Date(workOrder.dateNeeded), 'MMM d, yyyy') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <Badge className={priorityColors[workOrder.priority] || ""}>
                              {workOrder.priority.charAt(0).toUpperCase() + workOrder.priority.slice(1)}
                            </Badge>
                            <Badge className={statusColors[workOrder.status] || ""}>
                              {workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => handleViewDetails(workOrder)}>
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No work orders found</h3>
                  <p className="text-muted-foreground mt-2">
                    Get started by creating a new work order.
                  </p>
                  <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Work Order
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {isFormOpen && (
            <WorkOrderForm 
              onClose={() => setIsFormOpen(false)} 
              onSubmitSuccess={() => setIsFormOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
