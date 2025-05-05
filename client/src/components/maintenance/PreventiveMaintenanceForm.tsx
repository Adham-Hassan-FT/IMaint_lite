import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertWorkOrderSchema } from "@shared/schema";
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
import { CalendarIcon, CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Time periods for recurring maintenance
const recurringOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semiannual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
];

// Form schema
const formSchema = z.object({
  assetId: z.number(),
  maintenanceType: z.string(),
  description: z.string().min(5, "Description must be at least 5 characters"),
  startDate: z.date(),
  recurring: z.boolean().default(false),
  recurringPeriod: z.string().optional(),
  occurrences: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  technicians: z.array(z.number()).optional(),
  priority: z.string().default("medium"),
  duration: z.string().transform(val => parseFloat(val) || 1),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PreventiveMaintenanceFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function PreventiveMaintenanceForm({ 
  onClose, 
  onSubmitSuccess 
}: PreventiveMaintenanceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get assets for dropdown
  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['/api/assets'],
  });

  // Get work order types for dropdown
  const { data: workOrderTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['/api/work-order-types'],
  });

  // Get users for technician assignment
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Create mutation for scheduling PM
  const schedulePMMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // In a real app, this would create maintenance schedule entries
      // Here we'll simulate it by creating a work order for the first occurrence
      
      const workOrderData = {
        workOrderNumber: `PM-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `Preventive Maintenance - ${data.maintenanceType}`,
        description: data.description,
        status: "scheduled",
        priority: data.priority,
        assetId: data.assetId,
        requestedById: 1, // Default to admin user
        assignedToId: data.technicians?.[0], // Assign to first technician
        dateRequested: new Date(),
        dateNeeded: data.startDate,
        estimatedHours: data.duration,
        typeId: workOrderTypes?.find(t => t.name === "Preventive")?.id || 1,
      };
      
      await apiRequest("POST", "/api/work-orders", workOrderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      toast({
        title: "Maintenance Scheduled",
        description: "The preventive maintenance has been scheduled successfully",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to schedule maintenance",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maintenanceType: "General Inspection",
      description: "",
      startDate: new Date(),
      recurring: true,
      recurringPeriod: "monthly",
      occurrences: "12",
      duration: "1",
      priority: "medium",
      notes: "",
    },
  });

  // Watch form values
  const isRecurring = form.watch("recurring");
  const selectedAssetId = form.watch("assetId");
  
  // Selected asset details
  const selectedAsset = selectedAssetId && assets?.find(a => a.id === selectedAssetId);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await schedulePMMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Preventive Maintenance</DialogTitle>
          <DialogDescription>
            Create a preventive maintenance schedule for an asset
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectValue placeholder="Select an asset" />
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
            
            {selectedAsset && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Asset Details</span>
                </div>
                <div className="pl-6 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asset Type:</span>
                    <span>{selectedAsset.type?.name || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="capitalize">{selectedAsset.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{selectedAsset.location || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maintenanceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="General Inspection">General Inspection</SelectItem>
                        <SelectItem value="Lubrication">Lubrication</SelectItem>
                        <SelectItem value="Parts Replacement">Parts Replacement</SelectItem>
                        <SelectItem value="Calibration">Calibration</SelectItem>
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Safety Check">Safety Check</SelectItem>
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
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed maintenance tasks to be performed" 
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
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.5" 
                        step="0.5" 
                        placeholder="1" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Expected time to complete
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Recurring Maintenance
                    </FormLabel>
                    <FormDescription>
                      Schedule this maintenance to repeat at regular intervals
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
            
            {isRecurring && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurringPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat Every</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recurringOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="occurrences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Occurrences</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="100" 
                          placeholder="12" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        How many times to repeat
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="technicians"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Technicians</FormLabel>
                  <FormDescription>
                    Select technicians to assign to this maintenance
                  </FormDescription>
                  <div className="space-y-2 mt-2">
                    {isLoadingUsers ? (
                      <div className="text-sm text-muted-foreground">Loading technicians...</div>
                    ) : (
                      users?.filter(user => user.role === 'technician').map(tech => (
                        <div key={tech.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`tech-${tech.id}`} 
                            checked={field.value?.includes(tech.id)}
                            onCheckedChange={(checked) => {
                              const currentValues = field.value || [];
                              if (checked) {
                                field.onChange([...currentValues, tech.id]);
                              } else {
                                field.onChange(currentValues.filter(id => id !== tech.id));
                              }
                            }}
                          />
                          <label 
                            htmlFor={`tech-${tech.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {tech.fullName}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional instructions or requirements" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedAssetId}
              >
                {isSubmitting ? "Scheduling..." : "Schedule Maintenance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}