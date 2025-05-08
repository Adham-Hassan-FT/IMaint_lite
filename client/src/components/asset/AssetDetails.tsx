import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AssetWithDetails, assetStatusEnum } from "@shared/schema";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Drill, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Hash, 
  ClipboardList,
  Factory,
  FileText,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AssetForm from "./AssetForm";
import WorkOrderFormModal from "../workorder/WorkOrderFormModal";
import DocumentUploadModal from "../document/DocumentUploadModal";

const statusColors: Record<string, string> = {
  operational: "bg-green-100 text-green-800",
  non_operational: "bg-red-100 text-red-800",
  maintenance_required: "bg-amber-100 text-amber-800",
  retired: "bg-gray-100 text-gray-800",
};

interface AssetDetailsProps {
  asset: AssetWithDetails;
  onClose: () => void;
}

export default function AssetDetails({ asset, onClose }: AssetDetailsProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState(asset.status);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);

  // Get fresh data for the asset
  const { data: refreshedAsset, isLoading } = useQuery<AssetWithDetails>({
    queryKey: [`/api/assets/${asset.id}/details`],
    initialData: asset
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PUT", `/api/assets/${asset.id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/details'] });
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${asset.id}/details`] });
      toast({
        title: "Status Updated",
        description: "Asset status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error.message || "An unexpected error occurred",
      });
      // Reset status to the current value
      setStatus(asset.status);
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
        <h2 className="text-2xl font-bold">Asset Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{refreshedAsset.assetNumber}</CardTitle>
                  <CardDescription className="text-lg font-medium mt-1">
                    {refreshedAsset.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={statusColors[refreshedAsset.status] || ""}>
                    {refreshedAsset.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground mr-2">Status:</span>
                  <Badge className={statusColors[refreshedAsset.status] || ""}>
                    {refreshedAsset.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Badge>
                </div>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetStatusEnum.enumValues.map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {statusOption.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Drill className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Type:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.type?.name || 'Not specified'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Location:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.location || 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Factory className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Manufacturer:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.manufacturer || 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Drill className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Model:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.model || 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Serial Number:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.serialNumber || 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Install Date:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.installDate 
                      ? format(new Date(refreshedAsset.installDate), 'MMM d, yyyy') 
                      : 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Warranty Expiration:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.warrantyExpiration 
                      ? format(new Date(refreshedAsset.warrantyExpiration), 'MMM d, yyyy') 
                      : 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Replacement Cost:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.replacementCost 
                      ? `$${refreshedAsset.replacementCost.toFixed(2)}` 
                      : 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Drill className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Parent Asset:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedAsset.parent 
                      ? `${refreshedAsset.parent.assetNumber} - ${refreshedAsset.parent.description}` 
                      : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="secondary" 
                className="ml-auto"
                onClick={() => setIsEditFormOpen(true)}
              >
                Edit Asset
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="workorders">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="workorders">Work Orders</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="workorders" className="pt-4">
                  {refreshedAsset.workOrders && refreshedAsset.workOrders.length > 0 ? (
                    <div className="space-y-3">
                      {refreshedAsset.workOrders.map((workOrder) => (
                        <div key={workOrder.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{workOrder.workOrderNumber}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {workOrder.title}
                              </p>
                            </div>
                            <Badge className={statusColors[workOrder.status] || ""}>
                              {workOrder.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {workOrder.dateRequested 
                              ? format(new Date(workOrder.dateRequested), 'MMM d, yyyy') 
                              : 'No date'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">No work orders found for this asset</p>
                      <Button 
                        className="mt-2" 
                        variant="outline"
                        onClick={() => setIsWorkOrderFormOpen(true)}
                      >
                        Create Work Order
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="documents" className="pt-4">
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No documents attached to this asset</p>
                    <Button 
                      className="mt-2" 
                      variant="outline"
                      onClick={() => setIsDocumentUploadOpen(true)}
                    >
                      Upload Document
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setIsWorkOrderFormOpen(true)}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Create Work Order
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-4 border rounded bg-gray-50">
                <div className="text-center">
                  <p className="font-mono text-xl mb-2">{refreshedAsset.barcode || 'No barcode'}</p>
                  {refreshedAsset.barcode ? (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        Scan this barcode using the mobile app
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No barcode assigned to this asset
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
