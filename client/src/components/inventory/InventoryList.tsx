import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryItemWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MoreVertical, Plus, Package, Archive } from "lucide-react";
import InventoryForm from "./InventoryForm";
import InventoryDetails from "./InventoryDetails";

export default function InventoryList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithDetails | null>(null);
  const [itemToEdit, setItemToEdit] = useState<InventoryItemWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: inventoryItems, isLoading, isError } = useQuery<InventoryItemWithDetails[]>({
    queryKey: ['/api/inventory-items/details'],
  });

  const filteredItems = inventoryItems?.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "low") return item.quantityInStock <= (item.reorderPoint || 0);
    if (activeTab === "active") return item.isActive;
    if (activeTab === "inactive") return !item.isActive;
    return true;
  });

  const handleViewDetails = (item: InventoryItemWithDetails) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = (openEditMode?: boolean) => {
    setSelectedItem(null);
    
    if (openEditMode && selectedItem) {
      handleEdit(selectedItem);
    }
  };
  
  const handleEdit = (item: InventoryItemWithDetails) => {
    setItemToEdit(item);
    setIsFormOpen(true);
  };
  
  const handleFormClose = () => {
    setIsFormOpen(false);
    setItemToEdit(null);
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load inventory items. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {selectedItem ? (
        <InventoryDetails item={selectedItem} onClose={handleCloseDetails} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                Inventory
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage parts and supplies
              </p>
            </div>
            <Button 
              onClick={() => {
                setItemToEdit(null);
                setIsFormOpen(true);
              }}
              size="sm"
              className="self-start sm:self-auto"
            >
              <Plus className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> New Item
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:flex w-full md:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All Items</TabsTrigger>
              <TabsTrigger value="low" className="text-xs sm:text-sm">Low Stock</TabsTrigger>
              <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs sm:text-sm">Inactive</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4 sm:mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2 px-3 sm:px-6">
                        <Skeleton className="h-4 sm:h-5 w-3/4" />
                        <Skeleton className="h-3 sm:h-4 w-1/2" />
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 py-2">
                        <Skeleton className="h-3 sm:h-4 w-full mb-2" />
                        <Skeleton className="h-3 sm:h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 sm:h-4 w-1/2" />
                      </CardContent>
                      <CardFooter className="px-3 sm:px-6 py-2">
                        <Skeleton className="h-7 sm:h-8 w-full" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredItems && filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-all">
                      <CardHeader className="pb-2 px-3 sm:px-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base sm:text-lg">{item.partNumber}</CardTitle>
                            <CardDescription className="text-sm line-clamp-1">{item.name}</CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-7 w-7 p-0 sm:h-8 sm:w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>Adjust Quantity</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 py-2">
                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="truncate max-w-[120px] text-right">{item.category?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">In Stock:</span>
                            <span className={`font-medium ${
                              item.quantityInStock <= (item.reorderPoint || 0) 
                                ? 'text-red-600' 
                                : ''
                            }`}>
                              {item.quantityInStock || 0}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Unit Cost:</span>
                            <span>${typeof item.unitCost === 'string' 
                              ? parseFloat(item.unitCost || '0').toFixed(2) 
                              : (item.unitCost || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <span className="truncate max-w-[120px] text-right">{item.location || 'N/A'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {!item.isActive && (
                              <Badge variant="outline" className="bg-gray-100 text-xs">
                                Inactive
                              </Badge>
                            )}
                            {item.quantityInStock <= (item.reorderPoint || 0) && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                Low Stock
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="px-3 sm:px-6 py-2">
                        <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm h-8" onClick={() => handleViewDetails(item)}>
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
                    <Archive className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium">No inventory items found</h3>
                  <p className="text-sm text-muted-foreground mt-1 sm:mt-2">
                    Get started by creating a new inventory item.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3 sm:mt-4" 
                    onClick={() => {
                      setItemToEdit(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> New Item
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {isFormOpen && (
            <InventoryForm 
              onClose={handleFormClose} 
              onSubmitSuccess={handleFormClose}
              editItem={itemToEdit}
            />
          )}
        </>
      )}
    </div>
  );
}
