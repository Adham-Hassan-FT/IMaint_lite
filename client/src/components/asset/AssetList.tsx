import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AssetWithDetails } from "@shared/schema";
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
import { AlertCircle, MoreVertical, Plus, Drill, Settings } from "lucide-react";
import AssetForm from "./AssetForm";
import AssetDetails from "./AssetDetails";

const statusColors: Record<string, string> = {
  operational: "bg-green-100 text-green-800",
  non_operational: "bg-red-100 text-red-800",
  maintenance_required: "bg-amber-100 text-amber-800",
  retired: "bg-gray-100 text-gray-800",
};

export default function AssetList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: assets, isLoading, isError } = useQuery<AssetWithDetails[]>({
    queryKey: ['/api/assets/details'],
  });

  const filteredAssets = assets?.filter(asset => {
    if (activeTab === "all") return true;
    if (activeTab === "operational") return asset.status === "operational";
    if (activeTab === "maintenance") return asset.status === "maintenance_required";
    if (activeTab === "non_operational") return asset.status === "non_operational";
    return true;
  });

  const handleViewDetails = (asset: AssetWithDetails) => {
    setSelectedAsset(asset);
  };

  const handleCloseDetails = () => {
    setSelectedAsset(null);
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load assets. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {selectedAsset ? (
        <AssetDetails asset={selectedAsset} onClose={handleCloseDetails} />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Drill className="h-6 w-6" />
                Assets
              </h2>
              <p className="text-muted-foreground">
                Manage company assets and equipment
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Asset
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="operational">Operational</TabsTrigger>
              <TabsTrigger value="maintenance">Needs Maintenance</TabsTrigger>
              <TabsTrigger value="non_operational">Non-Operational</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-8 w-20" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredAssets && filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssets.map((asset) => (
                    <Card key={asset.id} className="hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{asset.assetNumber}</CardTitle>
                            <CardDescription>{asset.description}</CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(asset)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{asset.type?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{asset.location || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Manufacturer:</span>
                            <span>{asset.manufacturer || 'N/A'}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Badge className={statusColors[asset.status] || ""}>
                              {asset.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => handleViewDetails(asset)}>
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Settings className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No assets found</h3>
                  <p className="text-muted-foreground mt-2">
                    Get started by creating a new asset.
                  </p>
                  <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Asset
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {isFormOpen && (
            <AssetForm 
              onClose={() => setIsFormOpen(false)} 
              onSubmitSuccess={() => setIsFormOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
