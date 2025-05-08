import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertWorkOrderLaborSchema } from "@shared/schema";
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

// Create a custom schema for form validation
const formSchema = z.object({
  userId: z.number({
    required_error: "Please select a technician",
  }),
  workOrderId: z.number(),
  hours: z.coerce.number().min(0.1, "Hours must be at least 0.1"),
  notes: z.string().optional(),
  datePerformed: z.date({
    required_error: "Please select a date",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkOrderLaborFormProps {
  workOrderId: number;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function WorkOrderLaborForm({ 
  workOrderId, 
  onClose, 
  onSubmitSuccess 
}: WorkOrderLaborFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get users for dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  // Create mutation for adding labor
  const createLaborMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert the data to the format expected by the server
      const payload = {
        workOrderId: data.workOrderId,
        userId: data.userId,
        hours: data.hours.toString(),
        notes: data.notes || "",
        // Send raw Date object; JSON.stringify will convert to ISO 8601 string
        datePerformed: data.datePerformed, 
      };

      // Use JSON format with correct content type
      const response = await fetch(`/api/work-orders/${workOrderId}/labor`, {
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
          } else if (errorData.errors && Array.isArray(errorData.errors)) { // Fallback for original error format
             errorMessage = `${response.status}: ${errorData.message || 'Validation error'} - ${errorData.errors.map((e: any) => e.message).join(', ')}`;
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
        title: "Labor Entry Added",
        description: "The labor entry was added successfully",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add labor entry",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workOrderId: workOrderId,
      datePerformed: new Date(),
      hours: 1,
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createLaborMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Labor Entry</DialogTitle>
          <DialogDescription>
            Record time spent working on this work order
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technician</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        users.map((user) => (
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
              name="datePerformed"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Performed</FormLabel>
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
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Spent</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0.1" 
                      step="0.1" 
                      placeholder="1" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the number of hours worked
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Work performed, issues encountered, etc." 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Labor Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}