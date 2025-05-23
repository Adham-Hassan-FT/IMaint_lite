import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertAssetSchema, assetStatusEnum } from "@shared/schema";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

// Define types for our data
interface AssetType {
  id: number;
  name: string;
}

interface Asset {
  id: number;
  assetNumber: string;
  description: string;
  [key: string]: any;
}

// Extend the schema with custom validation
const formSchema = insertAssetSchema.extend({
  assetNumber: z.string().min(2, "Asset number must be at least 2 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  installDate: z.date().optional(),
  warrantyExpiration: z.date().optional(),
  replacementCost: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  status: z.string(),
  typeId: z.number().optional(),
  parentId: z.number().nullable().optional(),
  location: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssetFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
  editAsset?: any; // The asset to edit, if provided
}

export default function AssetForm({ onClose, onSubmitSuccess, editAsset }: AssetFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editAsset;
  
  // Get asset types for selection
  const { data: assetTypes = [], isLoading: isLoadingTypes } = useQuery<AssetType[]>({
    queryKey: ['/api/asset-types'],
  });

  // Get parent assets for selection
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  // Helper function to safely parse date strings
  const parseDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    } catch (e) {
      return undefined;
    }
  };

  // Prepare default values for the form
  const defaultValues = isEditing ? {
    assetNumber: editAsset.assetNumber || "",
    description: editAsset.description || "",
    status: editAsset.status || "operational",
    typeId: editAsset.typeId || undefined,
    parentId: editAsset.parentId || null,
    location: editAsset.location || "",
    manufacturer: editAsset.manufacturer || "",
    model: editAsset.model || "",
    serialNumber: editAsset.serialNumber || "",
    installDate: editAsset.installDate ? new Date(editAsset.installDate) : undefined,
    warrantyExpiration: editAsset.warrantyExpiration ? new Date(editAsset.warrantyExpiration) : undefined,
    replacementCost: editAsset.replacementCost ? editAsset.replacementCost.toString() : "",
    barcode: editAsset.barcode || "",
  } : {
    assetNumber: "",
    description: "",
    status: "operational",
    location: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
  } as FormValues;

  // Create mutation for creating asset
  const createAssetMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await apiRequest("POST", "/api/assets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: "Asset Created",
        description: "The asset was created successfully",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create asset",
        description: error.message || "An unexpected error occurred",
      });
    },
  });
  
  // Update mutation for editing asset
  const updateAssetMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await apiRequest("PUT", `/api/assets/${editAsset.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${editAsset.id}/details`] });
      toast({
        title: "Asset Updated",
        description: "The asset was updated successfully",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update asset",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Effect to update form values when editAsset changes
  useEffect(() => {
    if (isEditing) {
      form.reset({
        assetNumber: editAsset.assetNumber || "",
        description: editAsset.description || "",
        status: editAsset.status || "operational",
        typeId: editAsset.typeId || undefined,
        parentId: editAsset.parentId || null,
        location: editAsset.location || "",
        manufacturer: editAsset.manufacturer || "",
        model: editAsset.model || "",
        serialNumber: editAsset.serialNumber || "",
        installDate: editAsset.installDate ? new Date(editAsset.installDate) : undefined,
        warrantyExpiration: editAsset.warrantyExpiration ? new Date(editAsset.warrantyExpiration) : undefined,
        replacementCost: editAsset.replacementCost ? editAsset.replacementCost.toString() : "",
        barcode: editAsset.barcode || "",
      } as FormValues);
    }
  }, [editAsset, isEditing, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateAssetMutation.mutateAsync(data);
      } else {
        await createAssetMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Asset' : 'Create New Asset'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the details for this asset' 
              : 'Enter the details for the new asset'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assetNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Number</FormLabel>
                  <FormControl>
                    <Input placeholder="A-001" {...field} value={field.value || ''} />
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
                    <Input placeholder="Asset description" {...field} value={field.value || ''} />
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
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString() || undefined}
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
                          assetTypes.map((type) => (
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
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value as string}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetStatusEnum.enumValues.map((status) => (
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
            </div>
            
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Asset</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent asset (if applicable)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {isLoadingAssets ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        assets.filter(asset => asset.id !== editAsset?.id).map((asset) => (
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Building 1, Floor 2" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input placeholder="Manufacturer name" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Model number" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Serial number" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="installDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Install Date</FormLabel>
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
                              <span className="text-muted-foreground">Pick a date</span>
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
                name="warrantyExpiration"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Warranty Expiration</FormLabel>
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
                              <span className="text-muted-foreground">Pick a date</span>
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
            </div>
            
            <FormField
              control={form.control}
              name="replacementCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Replacement Cost</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input placeholder="Asset barcode" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Asset" : "Create Asset")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
