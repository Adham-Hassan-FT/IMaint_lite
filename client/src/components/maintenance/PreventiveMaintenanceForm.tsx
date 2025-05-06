import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { AssetWithDetails, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for preventive maintenance
const formSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
  assetId: z.number().positive("Please select an asset"),
  priority: z.string(),
  duration: z.number().positive("Duration must be greater than 0"),
  maintenanceType: z.string(),
  startDate: z.date(),
  recurring: z.boolean().default(false),
  notes: z.string().optional(),
  recurringPeriod: z.string().optional(),
  occurrences: z.number().optional(),
  technicians: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PreventiveMaintenanceFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function PreventiveMaintenanceForm({ onClose, onSubmitSuccess }: PreventiveMaintenanceFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  
  // Get assets for dropdown
  const { data: assets, isLoading: isLoadingAssets } = useQuery<AssetWithDetails[]>({
    queryKey: ['/api/assets/details'],
  });
  
  // Get users for technician assignment
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Initialize form with default values
  const defaultAssetId = assets && assets.length > 0 ? assets[0].id : 1;
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      assetId: defaultAssetId,
      priority: "medium",
      duration: 1,
      maintenanceType: "inspection",
      startDate: new Date(),
      recurring: false,
      notes: "",
      recurringPeriod: "monthly",
      occurrences: 12,
      technicians: [],
    },
  });
  
  // Watch recurring field to conditionally show additional fields
  const isRecurring = form.watch("recurring");
  
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // In a real app, this would create a preventive maintenance schedule record
      // For now, simulate creating a work order instead
      
      // Generate a unique work order number
      const workOrderNumber = `PM-${Date.now().toString().slice(-6)}`;
      
      const response = await apiRequest("POST", "/api/work-orders", {
        workOrderNumber: workOrderNumber,
        title: `Preventive Maintenance: ${data.description}`,
        description: data.description,
        assetId: data.assetId,
        priority: data.priority,
        status: "requested",
        dateNeeded: data.startDate,
        dateRequested: new Date(),
        estimatedHours: data.duration.toString(),
        notes: data.notes || null,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Maintenance scheduled",
        description: "Preventive maintenance has been scheduled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders/details'] });
      setOpen(false);
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to schedule maintenance",
        description: "An error occurred while scheduling maintenance. Please try again.",
      });
      console.error(error);
    },
  });
  
  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    submitMutation.mutate(data);
  };
  
  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Preventive Maintenance</DialogTitle>
          <DialogDescription>
            Create a new preventive maintenance task for an asset
          </DialogDescription>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Quarterly HVAC Inspection" {...field} />
                  </FormControl>
                  <FormDescription>
                    Brief description of the maintenance task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <Select 
                    onValueChange={(value) => value === "none" ? field.onChange(null) : field.onChange(parseInt(value))}
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {assets?.map(asset => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.assetNumber} - {asset.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maintenanceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="service">Service/Lubrication</SelectItem>
                        <SelectItem value="calibration">Calibration</SelectItem>
                        <SelectItem value="replacement">Part Replacement</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full pl-3 text-left font-normal"
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
                    <FormLabel>Duration (hours)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0.5}
                        step={0.5}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recurring Maintenance</FormLabel>
                    <FormDescription>
                      Schedule this maintenance to occur repeatedly
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {isRecurring && (
              <div className="border rounded-md p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurringPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Period</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="semiannually">Semi-annually</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
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
                            min={1}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How many times this should repeat
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="technicians"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Technicians (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      const id = parseInt(value);
                      if (!field.value?.includes(id)) {
                        field.onChange([...(field.value || []), id]);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select technicians" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map(techId => {
                        const tech = users?.find(u => u.id === techId);
                        return tech ? (
                          <div key={tech.id} className="flex items-center bg-secondary rounded-full px-3 py-1 text-sm">
                            {tech.fullName}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => {
                                field.onChange(field.value?.filter(id => id !== tech.id));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  <FormDescription>
                    Assign one or more technicians to this maintenance task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional instructions or notes"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Scheduling..." : "Schedule Maintenance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}