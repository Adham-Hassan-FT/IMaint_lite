import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, FileText, FilterX, Filter, LineChart, PieChart } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { WorkOrder, Asset, InventoryItem } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const [timeFrame, setTimeFrame] = useState("monthly");
  const [reportType, setReportType] = useState("workOrders");

  // Queries to fetch data for reports
  const { data: workOrders = [], isLoading: workOrdersLoading } = useQuery<WorkOrder[]>({
    queryKey: ['/api/work-orders'],
    enabled: reportType === "workOrders"
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    enabled: reportType === "assets"
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory-items'],
    enabled: reportType === "inventory"
  });

  const isLoading = workOrdersLoading || assetsLoading || inventoryLoading;

  // Helper function to get count summaries
  const getSummary = () => {
    switch (reportType) {
      case "workOrders":
        const totalWO = workOrders.length;
        const completedWO = workOrders.filter(wo => wo.status === "completed").length;
        const inProgressWO = workOrders.filter(wo => wo.status === "in_progress").length;
        return {
          total: totalWO,
          completed: completedWO,
          inProgress: inProgressWO,
          pending: totalWO - completedWO - inProgressWO
        };
      case "assets":
        const totalAssets = assets.length;
        const activeAssets = assets.filter(asset => asset.status === "operational").length;
        return {
          total: totalAssets,
          active: activeAssets,
          inactive: totalAssets - activeAssets
        };
      case "inventory":
        const totalInventory = inventory.length;
        const lowStock = inventory.filter(item => 
          (item.quantityInStock || 0) <= (item.reorderPoint || 0)).length;
        return {
          total: totalInventory,
          lowStock: lowStock,
          adequate: totalInventory - lowStock
        };
      default:
        return { total: 0 };
    }
  };

  const summary = getSummary();

  // Function to export data to CSV
  const exportToCSV = () => {
    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];
    
    switch (reportType) {
      case "workOrders":
        data = workOrders || [];
        filename = `work-orders-report-${timeFrame}-${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Work Order Number', 'Title', 'Status', 'Priority', 'Created Date', 'Due Date', 'Completed Date'];
        break;
      case "assets":
        data = assets || [];
        filename = `assets-report-${timeFrame}-${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Asset Number', 'Description', 'Status', 'Location', 'Model', 'Install Date'];
        break;
      case "inventory":
        data = inventory || [];
        filename = `inventory-report-${timeFrame}-${new Date().toISOString().split('T')[0]}.csv`;
        headers = ['ID', 'Part Number', 'Name', 'Quantity In Stock', 'Reorder Point', 'Unit Cost', 'Location'];
        break;
      default:
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: "No data available to export."
        });
        return;
    }
    
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No data available to export."
      });
      return;
    }
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(item => {
      let row = '';
      switch (reportType) {
        case "workOrders":
          row = [
            item.id,
            `"${item.workOrderNumber}"`,
            `"${item.title}"`,
            `"${item.status}"`,
            `"${item.priority}"`,
            item.dateRequested ? new Date(item.dateRequested).toLocaleDateString() : '',
            item.dateNeeded ? new Date(item.dateNeeded).toLocaleDateString() : '',
            item.dateCompleted ? new Date(item.dateCompleted).toLocaleDateString() : ''
          ].join(',');
          break;
        case "assets":
          row = [
            item.id,
            `"${item.assetNumber}"`,
            `"${item.description}"`,
            `"${item.status}"`,
            `"${item.location || ''}"`,
            `"${item.model || ''}"`,
            item.installDate ? new Date(item.installDate).toLocaleDateString() : ''
          ].join(',');
          break;
        case "inventory":
          row = [
            item.id,
            `"${item.partNumber}"`,
            `"${item.name}"`,
            item.quantityInStock,
            item.reorderPoint || 0,
            item.unitCost || 0,
            `"${item.location || ''}"`
          ].join(',');
          break;
      }
      csvContent += row + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `Report has been downloaded as ${filename}`
    });
  };

  // Function to download specific report
  const downloadReport = () => {
    exportToCSV();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <Select 
            value={timeFrame} 
            onValueChange={(value) => setTimeFrame(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="workOrders" value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="workOrders">Work Orders</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="costs">Costs & Labor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workOrders">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Work Order Summary</CardTitle>
                <CardDescription>
                  Overview of all work orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{summary.total}</div>
                <p className="text-sm text-muted-foreground mt-2">Total work orders</p>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="text-sm font-medium text-green-600">{summary.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">In Progress</span>
                    <span className="text-sm font-medium text-blue-600">{summary.inProgress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending</span>
                    <span className="text-sm font-medium text-amber-600">{summary.pending}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Completion Rate</CardTitle>
                <CardDescription>
                  Work order completion metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[220px]">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                ) : (
                  <div className="flex flex-col items-center">
                    <PieChart className="h-24 w-24 text-primary mb-2" />
                    <p className="text-2xl font-bold">
                      {summary.total > 0 
                        ? Math.round((summary.completed / summary.total) * 100) 
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Completion rate
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Average Resolution Time</CardTitle>
                <CardDescription>
                  Time to resolve work orders
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[220px]">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                ) : (
                  <div className="flex flex-col items-center">
                    <LineChart className="h-24 w-24 text-primary mb-2" />
                    <p className="text-2xl font-bold">2.3 days</p>
                    <p className="text-sm text-muted-foreground">
                      Average resolution time
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Work Order Trends</CardTitle>
                <CardDescription>
                  Work order volume over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <BarChart className="h-24 w-24 text-muted-foreground" />
                <p className="ml-4 text-muted-foreground">Chart visualization will be displayed here</p>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" size="sm" onClick={downloadReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="assets">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Asset Summary</CardTitle>
                <CardDescription>
                  Overview of all assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{summary.total}</div>
                <p className="text-sm text-muted-foreground mt-2">Total assets</p>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active</span>
                    <span className="text-sm font-medium text-green-600">{summary.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Inactive</span>
                    <span className="text-sm font-medium text-gray-600">{summary.inactive}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Maintenance Frequency</CardTitle>
                <CardDescription>
                  Asset maintenance requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[220px]">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                ) : (
                  <div className="flex flex-col items-center">
                    <BarChart className="h-24 w-24 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground pt-2">
                      Visualization coming soon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Asset Utilization</CardTitle>
                <CardDescription>
                  Usage patterns by asset category
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[220px]">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                ) : (
                  <div className="flex flex-col items-center">
                    <LineChart className="h-24 w-24 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground pt-2">
                      Visualization coming soon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="inventory">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Inventory Summary</CardTitle>
                <CardDescription>
                  Overview of inventory items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{summary.total}</div>
                <p className="text-sm text-muted-foreground mt-2">Total inventory items</p>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Low Stock</span>
                    <span className="text-sm font-medium text-red-600">{summary.lowStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Adequate Stock</span>
                    <span className="text-sm font-medium text-green-600">{summary.adequate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Inventory Value</CardTitle>
                <CardDescription>
                  Total inventory valuation
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[220px]">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                ) : (
                  <div className="flex flex-col items-center">
                    <PieChart className="h-24 w-24 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground pt-2">
                      Visualization coming soon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Stock Turnover</CardTitle>
                <CardDescription>
                  Inventory movement rate
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[220px]">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                ) : (
                  <div className="flex flex-col items-center">
                    <LineChart className="h-24 w-24 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground pt-2">
                      Visualization coming soon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="maintenance">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <h3 className="text-lg font-medium">Maintenance Reports</h3>
              <p className="text-muted-foreground">Maintenance analytics coming soon</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="costs">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <h3 className="text-lg font-medium">Cost & Labor Reports</h3>
              <p className="text-muted-foreground">Cost analytics coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}