import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertWorkOrderSchema, workOrderPriorityEnum, workOrderStatusEnum, WorkOrderType, Asset, User } from "@shared/schema";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Extend the schema with custom validation
const formSchema = insertWorkOrderSchema.extend({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  dateNeeded: z.date().optional(),
  dateRequested: z.date().default(() => new Date()),
  estimatedHours: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  estimatedCost: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkOrderFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function WorkOrderForm({ onClose, onSubmitSuccess }: WorkOrderFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get work order types for dropdown
  const { data: workOrderTypes = [], isLoading: isLoadingTypes } = useQuery<WorkOrderType[]>({
    queryKey: ['/api/work-order-types'],
  });

  // Get assets for dropdown
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  // Get users for dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Create mutation for creating work order
  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await apiRequest("POST", "/api/work-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      toast({
        title: "Work Order Created",
        description: "The work order was created successfully",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create work order",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  // Generate unique work order number
  const uniqueWorkOrderNumber = `WO-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Wait for data to load before initializing the form
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Initialize form with basic defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workOrderNumber: uniqueWorkOrderNumber,
      title: "",
      description: "",
      status: "requested",
      priority: "medium",
      dateRequested: new Date(),
      assetId: 1,
      typeId: 1,
      requestedById: 1,
    },
  });
  
  useEffect(() => {
    // Wait for data to be loaded before initializing form with default values
    if (!isLoadingTypes && !isLoadingAssets && !isLoadingUsers && !formInitialized) {
      // Find default IDs from loaded data
      const defaultAssetId = assets && assets.length > 0 ? assets[0].id : 1;
      const defaultTypeId = workOrderTypes && workOrderTypes.length > 0 ? workOrderTypes[0].id : 1;
      const defaultRequestedById = users && users.length > 0 ? users[0].id : 1;
      
      // Set default values
      form.reset({
        workOrderNumber: uniqueWorkOrderNumber,
        title: "",
        description: "",
        status: "requested",
        priority: "medium",
        dateRequested: new Date(),
        assetId: defaultAssetId,
        typeId: defaultTypeId,
        requestedById: defaultRequestedById,
      });
      
      setFormInitialized(true);
    }
  }, [isLoadingTypes, isLoadingAssets, isLoadingUsers, assets, workOrderTypes, users, formInitialized, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting work order data:', data);
      // Ensure all required IDs are numbers
      const formattedData = {
        ...data,
        typeId: Number(data.typeId),
        assetId: Number(data.assetId),
        requestedById: Number(data.requestedById),
        assignedToId: data.assignedToId ? Number(data.assignedToId) : undefined
      };
      await createWorkOrderMutation.mutateAsync(formattedData);
    } catch (error) {
      console.error('Error submitting work order:', error);
      toast({
        variant: "destructive",
        title: "Failed to create work order",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Work Order</DialogTitle>
          <DialogDescription>
            Enter the details for the new maintenance work order
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="workOrderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order #</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormDescription>
                      Automatically generated number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order Type</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingTypes ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          workOrderTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Work order title" {...field} />
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
                      placeholder="Detailed description of the work required" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingAssets ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          assets?.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              {asset.assetNumber} - {asset.description}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(workOrderPriorityEnum.enumValues).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(workOrderStatusEnum.enumValues).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      New work orders start as "Requested"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requestedById"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested By</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select requestor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingUsers ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          users?.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName}
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Not Assigned</SelectItem>
                        {isLoadingUsers ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          users?.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateNeeded"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Needed</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the work needs to be completed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
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