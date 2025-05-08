import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertWorkOrderSchema, workOrderStatusEnum } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Link2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Extend the schema with custom validation
const formSchema = insertWorkOrderSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please provide a detailed description").optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  assetId?: number; // Optional assetId for pre-populating
}

export default function WorkOrderFormModal({ 
  isOpen, 
  onClose, 
  onSubmitSuccess,
  assetId 
}: WorkOrderFormModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get work order types for selection
  const { data: workOrderTypes } = useQuery({
    queryKey: ['/api/work-order-types'],
    enabled: isOpen,
  });

  // Get assets for selection if no assetId is provided
  const { data: assets } = useQuery({
    queryKey: ['/api/assets'],
    enabled: isOpen && !assetId,
  });
  
  // Get the specific asset details if assetId is provided
  const { data: selectedAsset } = useQuery({
    queryKey: [`/api/assets/${assetId}`],
    enabled: isOpen && !!assetId,
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "requested",
      priorityLevel: "medium",
      assetId: assetId || null,
      assignedToId: null,
      typeId: null,
      estimatedCost: null,
    },
  });
  
  // Update form when asset is loaded
  useEffect(() => {
    if (selectedAsset && assetId) {
      // Pre-populate title with asset info if empty
      const currentTitle = form.getValues('title');
      if (!currentTitle) {
        form.setValue('title', `Maintenance for ${selectedAsset.assetNumber} - ${selectedAsset.description}`);
      }
    }
  }, [selectedAsset, assetId, form]);

  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/work-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      if (assetId) {
        queryClient.invalidateQueries({ queryKey: [`/api/assets/${assetId}/details`] });
      }
      toast({
        title: "Work Order Created",
        description: "The new work order has been created successfully.",
      });
      form.reset();
      if (onSubmitSuccess) onSubmitSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createWorkOrderMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    operational: "bg-green-100 text-green-800",
    non_operational: "bg-red-100 text-red-800",
    maintenance_required: "bg-amber-100 text-amber-800",
    retired: "bg-gray-100 text-gray-800",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Work Order</DialogTitle>
          <DialogDescription>
            Create a new work order for maintenance or repair.
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {assetId && selectedAsset && (
          <Card className="bg-muted/50 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <Link2 className="h-4 w-4 mr-2 text-primary" />
                <h3 className="text-sm font-medium">Associated Asset</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">{selectedAsset.assetNumber}</p>
                  {selectedAsset.status && (
                    <Badge className={statusColors[selectedAsset.status]}>
                      {selectedAsset.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{selectedAsset.description}</p>
                {selectedAsset.location && (
                  <p className="text-xs text-muted-foreground">Location: {selectedAsset.location}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter work order title" {...field} />
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
                    <Textarea 
                      placeholder="Enter detailed description of the work to be performed" 
                      className="min-h-[100px]"
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order Type</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workOrderTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priorityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!assetId && (
                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assets?.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              {asset.assetNumber} - {asset.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the asset this work order is for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem className={!assetId ? "" : "col-span-2"}>
                    <FormLabel>Estimated Cost</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          className="rounded-l-none"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                          value={field.value === null ? "" : field.value}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workOrderStatusEnum.enumValues.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Work Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}