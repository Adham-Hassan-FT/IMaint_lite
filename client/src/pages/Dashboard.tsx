import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Home, 
  ClipboardList, 
  Drill, 
  Package, 
  CheckCircle, 
  Clock, 
  Calendar,
  Wrench,
  BarChart
} from "lucide-react";
import { WorkOrderWithDetails, AssetWithDetails, InventoryItemWithDetails } from "@shared/schema";

export default function Dashboard() {
  // Fetch data for dashboard
  const { data: workOrders, isLoading: isLoadingWorkOrders } = useQuery<WorkOrderWithDetails[]>({
    queryKey: ['/api/work-orders/details'],
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery<AssetWithDetails[]>({
    queryKey: ['/api/assets/details'],
  });

  const { data: inventoryItems, isLoading: isLoadingInventory } = useQuery<InventoryItemWithDetails[]>({
    queryKey: ['/api/inventory-items/details'],
  });

  // Calculate statistics
  const statsWorkOrders = {
    total: workOrders?.length || 0,
    open: workOrders?.filter(wo => 
      ["requested", "approved", "scheduled", "in_progress"].includes(wo.status)
    ).length || 0,
    overdue: workOrders?.filter(wo => 
      wo.dateNeeded && new Date(wo.dateNeeded) < new Date() && 
      !["completed", "cancelled"].includes(wo.status)
    ).length || 0,
    completed: workOrders?.filter(wo => wo.status === "completed").length || 0,
  };

  const statsAssets = {
    total: assets?.length || 0,
    operational: assets?.filter(a => a.status === "operational").length || 0,
    needsMaintenance: assets?.filter(a => a.status === "maintenance_required").length || 0,
    nonOperational: assets?.filter(a => a.status === "non_operational").length || 0,
  };

  const statsInventory = {
    total: inventoryItems?.length || 0,
    lowStock: inventoryItems?.filter(item => 
      item.quantityInStock <= (item.reorderPoint || 0)
    ).length || 0,
  };

  // Dashboard skeleton loading state
  if (isLoadingWorkOrders || isLoadingAssets || isLoadingInventory) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Home className="h-6 w-6" />
          Dashboard
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-muted rounded mb-2" />
                <div className="h-4 w-36 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-4 w-8 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Home className="h-6 w-6" />
        Dashboard
      </h2>
      
      {/* Status cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Orders</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsWorkOrders.total}</div>
            <p className="text-xs text-muted-foreground">
              {statsWorkOrders.open} open / {statsWorkOrders.completed} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Work</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsWorkOrders.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Work orders past due date
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Status</CardTitle>
            <Drill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsAssets.operational}</div>
            <p className="text-xs text-muted-foreground">
              Operational assets of {statsAssets.total} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsInventory.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Items below reorder point
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Summary sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Work Orders
            </CardTitle>
            <CardDescription>Latest maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workOrders?.slice(0, 4).map(workOrder => (
                <div key={workOrder.id} className="flex justify-between items-start border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{workOrder.workOrderNumber}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{workOrder.title}</p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    workOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                    workOrder.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {workOrder.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                </div>
              ))}
              
              {workOrders?.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No work orders found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Assets Needing Attention
            </CardTitle>
            <CardDescription>Maintenance required assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets?.filter(asset => 
                asset.status === "maintenance_required" || asset.status === "non_operational"
              ).slice(0, 4).map(asset => (
                <div key={asset.id} className="flex justify-between items-start border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{asset.assetNumber}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{asset.description}</p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    asset.status === 'maintenance_required' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {asset.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                </div>
              ))}
              
              {assets?.filter(asset => 
                asset.status === "maintenance_required" || asset.status === "non_operational"
              ).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No assets need attention</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Alerts
            </CardTitle>
            <CardDescription>Items that need reordering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryItems?.filter(item => 
                item.quantityInStock <= (item.reorderPoint || 0)
              ).slice(0, 4).map(item => (
                <div key={item.id} className="flex justify-between items-start border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.partNumber}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.name}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-red-600">{item.quantityInStock} in stock</span>
                    <span className="text-xs text-muted-foreground">
                      Reorder at {item.reorderPoint}
                    </span>
                  </div>
                </div>
              ))}
              
              {inventoryItems?.filter(item => 
                item.quantityInStock <= (item.reorderPoint || 0)
              ).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No inventory alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* System status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-700">Work Efficiency</h3>
                <CheckCircle className="h-4 w-4 text-blue-700" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {workOrders && workOrders.length > 0
                  ? Math.round((statsWorkOrders.completed / statsWorkOrders.total) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-blue-600">Completion rate</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-700">Asset Health</h3>
                <CheckCircle className="h-4 w-4 text-green-700" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {assets && assets.length > 0
                  ? Math.round((statsAssets.operational / statsAssets.total) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-green-600">Operational rate</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-amber-700">Response Time</h3>
                <Clock className="h-4 w-4 text-amber-700" />
              </div>
              <p className="text-2xl font-bold text-amber-900">24h</p>
              <p className="text-xs text-amber-600">Average response</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-700">Scheduled Tasks</h3>
                <Calendar className="h-4 w-4 text-purple-700" />
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {workOrders?.filter(wo => wo.status === "scheduled").length || 0}
              </p>
              <p className="text-xs text-purple-600">Coming up</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
