import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertInventoryItemSchema } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Extend the schema with custom validation
const formSchema = insertInventoryItemSchema.extend({
  partNumber: z.string().min(2, "Part number must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  unitCost: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  quantityInStock: z.string().transform(val => parseInt(val) || 0),
  reorderPoint: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
  editItem?: any; // The item to edit, if provided
}

export default function InventoryForm({ onClose, onSubmitSuccess, editItem }: InventoryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editItem;
  
  // Get inventory categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/inventory-categories'],
  });

  // Create mutation for creating inventory item
  const createInventoryItemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await apiRequest("POST", "/api/inventory-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-items/details'] });
      toast({
        title: "Inventory Item Created",
        description: "The inventory item was created successfully",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create inventory item",
        description: error.message || "An unexpected error occurred",
      });
    },
  });
  
  // Update mutation for editing inventory item
  const updateInventoryItemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await apiRequest("PATCH", `/api/inventory-items/${editItem.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-items/details'] });
      toast({
        title: "Inventory Item Updated",
        description: "The inventory item was updated successfully",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update inventory item",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  // Set default values based on whether we're editing or creating
  const defaultValues = {
    partNumber: editItem?.partNumber || "",
    name: editItem?.name || "",
    description: editItem?.description || "",
    quantityInStock: editItem?.quantityInStock?.toString() || "0",
    isActive: editItem?.isActive !== undefined ? editItem.isActive : true,
    categoryId: editItem?.categoryId || null,
    unitCost: editItem?.unitCost?.toString() || "",
    reorderPoint: editItem?.reorderPoint?.toString() || "",
    location: editItem?.location || "",
    barcode: editItem?.barcode || "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateInventoryItemMutation.mutateAsync(data);
      } else {
        await createInventoryItemMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Inventory Item' : 'Create New Inventory Item'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this inventory item' : 'Enter the details for the new inventory item'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Number</FormLabel>
                    <FormControl>
                      <Input placeholder="P-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))} 
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {isLoadingCategories ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Item description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantityInStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity in Stock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Point</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Warehouse A, Shelf 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input placeholder="Item barcode" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Active
                    </FormLabel>
                    <FormDescription>
                      Is this item active in inventory?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Item" : "Create Item")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
