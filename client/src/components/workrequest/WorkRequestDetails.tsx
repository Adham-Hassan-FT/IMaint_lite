import { WorkRequestWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  AlertCircle,
  Clock,
  MapPin,
  Building,
  User,
  Wrench,
  Calendar,
  ArrowRightCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface WorkRequestDetailsProps {
  workRequest: WorkRequestWithDetails;
  onClose: () => void;
  onConvert: (id: number) => void;
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

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
};

export default function WorkRequestDetails({ 
  workRequest, 
  onClose,
  onConvert 
}: WorkRequestDetailsProps) {
  const formattedDateRequested = workRequest.dateRequested 
    ? format(new Date(workRequest.dateRequested), 'MMM d, yyyy, h:mm a') 
    : 'N/A';
  
  const formattedDateNeeded = workRequest.dateNeeded 
    ? format(new Date(workRequest.dateNeeded), 'MMM d, yyyy') 
    : 'N/A';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Work Request Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-2xl">{workRequest.title}</CardTitle>
                  <CardDescription>Request #{workRequest.requestNumber}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={priorityColors[workRequest.priority] || ""}>
                    {workRequest.priority.charAt(0).toUpperCase() + workRequest.priority.slice(1)} Priority
                  </Badge>
                  <Badge className={statusColors[workRequest.status] || ""}>
                    {workRequest.status.charAt(0).toUpperCase() + workRequest.status.slice(1)}
                  </Badge>
                  {workRequest.isConverted && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ArrowRightCircle className="h-3 w-3" />
                      Converted to Work Order
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{workRequest.description}</p>
              </div>
              
              {workRequest.notes && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Additional Notes</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{workRequest.notes}</p>
                </div>
              )}
              
              {workRequest.convertedToWorkOrder && (
                <div className="bg-muted rounded-md p-4 mt-6">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <ArrowRightCircle className="h-5 w-5" />
                    Converted to Work Order
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Work Order Number</p>
                      <p className="font-medium">{workRequest.convertedToWorkOrder.workOrderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={statusColors[workRequest.convertedToWorkOrder.status] || ""}>
                        {workRequest.convertedToWorkOrder.status.charAt(0).toUpperCase() + 
                          workRequest.convertedToWorkOrder.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      View Work Order
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            {!workRequest.isConverted && (
              <CardFooter>
                <Button 
                  onClick={() => onConvert(workRequest.id)} 
                  className="w-full"
                >
                  <ArrowRightCircle className="mr-2 h-5 w-5" />
                  Convert to Work Order
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Requested
                  </dt>
                  <dd>{formattedDateRequested}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Date Needed
                  </dt>
                  <dd>{formattedDateNeeded}</dd>
                </div>
                
                <Separator />
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Requested By
                  </dt>
                  <dd>{workRequest.requestedBy?.fullName || 'N/A'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </dt>
                  <dd>{workRequest.location || 'N/A'}</dd>
                </div>
                
                <Separator />
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Asset
                  </dt>
                  <dd>{workRequest.asset ? `${workRequest.asset.assetNumber} - ${workRequest.asset.description}` : 'N/A'}</dd>
                </div>
                
                {workRequest.asset?.status && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Asset Status
                    </dt>
                    <dd>
                      <Badge variant="outline">
                        {workRequest.asset.status.replace('_', ' ').charAt(0).toUpperCase() + 
                          workRequest.asset.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={onClose}>
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}