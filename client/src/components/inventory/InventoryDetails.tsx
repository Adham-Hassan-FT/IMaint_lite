import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InventoryItemWithDetails } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Package, 
  Archive, 
  DollarSign,
  MapPin,
  Tag,
  BarChart,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InventoryDetailsProps {
  item: InventoryItemWithDetails;
  onClose: () => void;
}

export default function InventoryDetails({ item, onClose }: InventoryDetailsProps) {
  const { toast } = useToast();
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("0");

  // Get fresh data for the inventory item
  const { data: refreshedItem, isLoading } = useQuery<InventoryItemWithDetails>({
    queryKey: [`/api/inventory-items/${item.id}/details`],
    initialData: item
  });

  // Quantity adjustment mutation
  const adjustQuantityMutation = useMutation({
    mutationFn: async (data: { quantityInStock: number }) => {
      await apiRequest("PUT", `/api/inventory-items/${item.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-items/details'] });
      queryClient.invalidateQueries({ queryKey: [`/api/inventory-items/${item.id}/details`] });
      toast({
        title: "Quantity Updated",
        description: "Inventory quantity has been updated successfully",
      });
      setAdjustmentQuantity("0");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update quantity",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const handleIncrement = () => {
    const currentQuantity = refreshedItem.quantityInStock || 0;
    const incrementAmount = parseInt(adjustmentQuantity) || 0;
    if (incrementAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Quantity",
        description: "Please enter a positive number",
      });
      return;
    }
    
    const newQuantity = currentQuantity + incrementAmount;
    adjustQuantityMutation.mutate({ quantityInStock: newQuantity });
  };

  const handleDecrement = () => {
    const currentQuantity = refreshedItem.quantityInStock || 0;
    const decrementAmount = parseInt(adjustmentQuantity) || 0;
    if (decrementAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Quantity",
        description: "Please enter a positive number",
      });
      return;
    }
    
    if (decrementAmount > currentQuantity) {
      toast({
        variant: "destructive",
        title: "Invalid Quantity",
        description: "Cannot decrease below zero",
      });
      return;
    }
    
    const newQuantity = currentQuantity - decrementAmount;
    adjustQuantityMutation.mutate({ quantityInStock: newQuantity });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={onClose} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Inventory Item Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{refreshedItem.partNumber}</CardTitle>
                  <CardDescription className="text-lg font-medium mt-1">
                    {refreshedItem.name}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!refreshedItem.isActive && (
                    <Badge variant="outline" className="bg-gray-100">
                      Inactive
                    </Badge>
                  )}
                  {refreshedItem.quantityInStock <= (refreshedItem.reorderPoint || 0) && (
                    <Badge className="bg-red-100 text-red-800">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {refreshedItem.description && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm">{refreshedItem.description}</p>
                  <Separator className="my-4" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Category:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedItem.category?.name || 'Not categorized'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Unit Cost:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    ${refreshedItem.unitCost?.toFixed(2) || '0.00'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Storage Location:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedItem.location || 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Barcode:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {refreshedItem.barcode || 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="ml-auto">Edit Item</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-700 mb-1">Current Stock</h3>
                  <p className="text-3xl font-bold">
                    {refreshedItem.quantityInStock || 0}
                  </p>
                  {refreshedItem.reorderPoint !== undefined && refreshedItem.reorderPoint !== null && (
                    <p className="text-sm text-blue-600 mt-1">
                      Reorder Point: {refreshedItem.reorderPoint}
                    </p>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Quick Adjustment</h3>
                  <div className="flex flex-col space-y-4">
                    <div>
                      <Label htmlFor="adjustment-quantity">Quantity</Label>
                      <Input 
                        id="adjustment-quantity"
                        type="number" 
                        min="0"
                        value={adjustmentQuantity}
                        onChange={(e) => setAdjustmentQuantity(e.target.value)}
                        placeholder="Enter quantity" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={handleIncrement}
                        disabled={adjustQuantityMutation.isPending}
                        variant="outline"
                        className="flex items-center"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                      <Button 
                        onClick={handleDecrement}
                        disabled={adjustQuantityMutation.isPending}
                        variant="outline"
                        className="flex items-center"
                      >
                        <MinusCircle className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Usage History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-2">
                  <BarChart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No usage history available
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
