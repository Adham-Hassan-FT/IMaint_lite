import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertWorkOrderPartSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

// Custom schema for form validation
const formSchema = z.object({
  workOrderId: z.number(),
  inventoryItemId: z.number({
    required_error: "Please select an inventory item",
  }),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkOrderPartFormProps {
  workOrderId: number;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function WorkOrderPartForm({ 
  workOrderId, 
  onClose, 
  onSubmitSuccess 
}: WorkOrderPartFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get inventory items for dropdown
  const { data: inventoryItems = [], isLoading: isLoadingItems } = useQuery<any[]>({
    queryKey: ['/api/inventory-items'],
  });

  // Create mutation for adding part
  const createPartMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Get the selected inventory item details
      const selectedItem = inventoryItems.find(item => item.id === data.inventoryItemId);
      
      let unitCostNum;
      if (selectedItem?.unitCost) {
        unitCostNum = typeof selectedItem.unitCost === 'string' 
          ? parseFloat(selectedItem.unitCost) 
          : selectedItem.unitCost;
      }
      
      const payload: any = {
        workOrderId: data.workOrderId,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity, // Send as number, as per form schema z.coerce.number()
        dateIssued: new Date().toISOString(),
      };

      if (unitCostNum !== undefined && !isNaN(unitCostNum)) {
        // Ensure stringification of values
        payload.unitCost = String(unitCostNum.toFixed(2));
        const totalCostValue = unitCostNum * data.quantity;
        payload.totalCost = String(totalCostValue.toFixed(2));
      }
      
      const response = await fetch(`/api/work-orders/${workOrderId}/parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `${response.status}: ${text}`;
        try {
          const errorData = JSON.parse(text);
          if (errorData.message && errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = `${response.status}: ${errorData.message} - ${errorData.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ')}`;
          } else if (errorData.message) {
            errorMessage = `${response.status}: ${errorData.message}`;
          }
        } catch (e) {
          // Fallback to original error message if parsing fails
        }
        throw new Error(errorMessage);
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}/details`] });
      toast({
        title: "Part Added",
        description: "The part was added to the work order successfully",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add part",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workOrderId: workOrderId,
      quantity: 1,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createPartMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected item details
  const selectedItemId = form.watch("inventoryItemId");
  const selectedItem = selectedItemId && inventoryItems?.find(item => item.id === selectedItemId);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Parts to Work Order</DialogTitle>
          <DialogDescription>
            Add inventory parts used for this work order
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inventoryItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory Item</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inventory item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingItems ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.partNumber} - {item.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedItem && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Available in stock:</span>
                  <span className="font-medium">{selectedItem.quantityInStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit cost:</span>
                  <span className="font-medium">${typeof selectedItem.unitCost === 'string' ? parseFloat(selectedItem.unitCost).toFixed(2) : (selectedItem.unitCost || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max={selectedItem?.quantityInStock || 999} 
                      placeholder="1" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      value={field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of units used
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedItemId || (selectedItem?.quantityInStock || 0) === 0}
              >
                {isSubmitting ? "Adding..." : "Add Part"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}