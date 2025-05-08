import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkRequestWithDetails, WorkOrderWithDetails } from "@shared/schema";
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
import { 
  AlertCircle, 
  MoreVertical, 
  Plus, 
  ClipboardList, 
  MessageSquare,
  ArrowRightCircle
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import WorkRequestForm from "./WorkRequestForm";
import WorkRequestDetails from "./WorkRequestDetails";

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

export default function WorkRequestList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WorkRequestWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workRequests, isLoading, isError } = useQuery<WorkRequestWithDetails[]>({
    queryKey: ['/api/work-requests/details'],
  });

  const convertToWorkOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/work-requests/${id}/convert`, {});
    },
    onSuccess: async (_, id) => {
      toast({
        title: "Converted to work order",
        description: "The work request has been converted to a work order successfully",
      });
      
      // Explicitly invalidate the specific work request details query
      await queryClient.invalidateQueries({ queryKey: [`/api/work-requests/${id}/details`] });
      
      // Refresh the overall lists
      await queryClient.invalidateQueries({ queryKey: ['/api/work-requests/details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      
      // If the request is currently selected, refresh it directly
      if (selectedRequest && selectedRequest.id === id) {
        const response = await apiRequest("GET", `/api/work-requests/${id}/details`);
        const updatedRequest = await response.json();
        setSelectedRequest(updatedRequest);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Conversion failed",
        description: "Failed to convert work request to a work order",
      });
      console.error(error);
    },
  });

  const filteredRequests = workRequests?.filter(request => {
    if (activeTab === "all") return true;
    if (activeTab === "open") {
      return ["requested", "approved"].includes(request.status) && !request.isConverted;
    }
    if (activeTab === "converted") return request.isConverted;
    if (activeTab === "closed") return ["completed", "cancelled"].includes(request.status);
    return true;
  });

  const handleViewDetails = (request: WorkRequestWithDetails) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const handleConvertToWorkOrder = (id: number) => {
    convertToWorkOrderMutation.mutate(id);
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load work requests. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {selectedRequest ? (
        <WorkRequestDetails 
          workRequest={selectedRequest} 
          onClose={handleCloseDetails} 
          onConvert={handleConvertToWorkOrder}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Work Requests
              </h2>
              <p className="text-muted-foreground">
                Submit and track maintenance and repair requests
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="converted">Converted</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
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
              ) : filteredRequests && filteredRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                            <CardDescription>{request.title}</CardDescription>
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
                              <DropdownMenuItem onClick={() => handleViewDetails(request)}>
                                View Details
                              </DropdownMenuItem>
                              {!request.isConverted && (
                                <DropdownMenuItem onClick={() => handleConvertToWorkOrder(request.id)}>
                                  Convert to Work Order
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Asset:</span>
                            <span>{request.asset?.description || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Requested by:</span>
                            <span>{request.requestedBy?.fullName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Date requested:</span>
                            <span>
                              {request.dateRequested ? format(new Date(request.dateRequested), 'MMM d, yyyy') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <Badge className={priorityColors[request.priority] || ""}>
                              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                            </Badge>
                            <Badge className={statusColors[request.status] || ""}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            {request.isConverted && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <ArrowRightCircle className="h-3 w-3" />
                                Converted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleViewDetails(request)}
                        >
                          View
                        </Button>
                        {!request.isConverted && (
                          <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => handleConvertToWorkOrder(request.id)}
                            disabled={convertToWorkOrderMutation.isPending}
                          >
                            <ArrowRightCircle className="mr-2 h-4 w-4" />
                            Convert
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No work requests found</h3>
                  <p className="text-muted-foreground mt-2">
                    Get started by creating a new work request.
                  </p>
                  <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Request
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {isFormOpen && (
            <WorkRequestForm 
              onClose={() => setIsFormOpen(false)} 
              onSubmitSuccess={() => setIsFormOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}