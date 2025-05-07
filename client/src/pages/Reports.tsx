import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  FileText, 
  Calendar,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  WorkOrderWithDetails, 
  AssetWithDetails, 
  InventoryItemWithDetails 
} from "@shared/schema";

export default function Reports() {
  const [timeframe, setTimeframe] = useState("last30days");
  const [assetCategory, setAssetCategory] = useState("all");
  
  // Fetch data for reports
  const { data: workOrders, isLoading: isLoadingWorkOrders } = useQuery<WorkOrderWithDetails[]>({
    queryKey: ['/api/work-orders/details'],
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery<AssetWithDetails[]>({
    queryKey: ['/api/assets/details'],
  });

  const { data: inventoryItems, isLoading: isLoadingInventory } = useQuery<InventoryItemWithDetails[]>({
    queryKey: ['/api/inventory-items/details'],
  });

  // Helper function to filter data by timeframe
  const filterByTimeframe = (date: Date) => {
    const now = new Date();
    const dateObj = new Date(date);
    
    switch (timeframe) {
      case "last7days":
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return dateObj >= sevenDaysAgo;
      case "last30days":
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return dateObj >= thirtyDaysAgo;
      case "last90days":
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return dateObj >= ninetyDaysAgo;
      case "last12months":
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setMonth(now.getMonth() - 12);
        return dateObj >= twelveMonthsAgo;
      case "all":
      default:
        return true;
    }
  };

  // Prepare work order statistics by status
  const workOrderByStatus = () => {
    if (!workOrders) return [];
    
    const filteredWorkOrders = workOrders.filter(wo => 
      filterByTimeframe(new Date(wo.dateCreated))
    );
    
    const counts = {
      requested: 0,
      approved: 0,
      scheduled: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0
    };
    
    filteredWorkOrders.forEach(wo => {
      counts[wo.status as keyof typeof counts]++;
    });
    
    return [
      { name: "Requested", value: counts.requested, color: "#f97316" },
      { name: "Approved", value: counts.approved, color: "#8b5cf6" },
      { name: "Scheduled", value: counts.scheduled, color: "#3b82f6" },
      { name: "In Progress", value: counts.in_progress, color: "#22c55e" },
      { name: "On Hold", value: counts.on_hold, color: "#eab308" },
      { name: "Completed", value: counts.completed, color: "#16a34a" },
      { name: "Cancelled", value: counts.cancelled, color: "#dc2626" }
    ];
  };

  // Prepare asset statistics by status
  const assetsByStatus = () => {
    if (!assets) return [];
    
    let filteredAssets = assets;
    
    if (assetCategory !== "all") {
      filteredAssets = assets.filter(asset => 
        asset.typeId === parseInt(assetCategory)
      );
    }
    
    const counts = {
      operational: 0,
      maintenance_required: 0,
      non_operational: 0,
      decommissioned: 0
    };
    
    filteredAssets.forEach(asset => {
      counts[asset.status as keyof typeof counts]++;
    });
    
    return [
      { name: "Operational", value: counts.operational, color: "#16a34a" },
      { name: "Needs Maintenance", value: counts.maintenance_required, color: "#eab308" },
      { name: "Non-Operational", value: counts.non_operational, color: "#dc2626" },
      { name: "Decommissioned", value: counts.decommissioned, color: "#6b7280" }
    ];
  };

  // Prepare work order timeline data
  const workOrderTimeline = () => {
    if (!workOrders) return [];
    
    const now = new Date();
    const timeLabels = [];
    const completedByPeriod = [];
    const createdByPeriod = [];
    
    // Create time periods based on selected timeframe
    let interval;
    let periods;
    
    switch (timeframe) {
      case "last7days":
        interval = "day";
        periods = 7;
        break;
      case "last30days":
        interval = "day";
        periods = 30;
        break;
      case "last90days":
        interval = "week";
        periods = 13; // ~90/7
        break;
      case "last12months":
        interval = "month";
        periods = 12;
        break;
      case "all":
      default:
        interval = "month";
        periods = 12;
        break;
    }
    
    // Generate periods
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now);
      
      if (interval === "day") {
        date.setDate(date.getDate() - i);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        timeLabels.push({ date, label });
      } else if (interval === "week") {
        date.setDate(date.getDate() - (i * 7));
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 6);
        const label = `${date.getMonth() + 1}/${date.getDate()}-${endDate.getMonth() + 1}/${endDate.getDate()}`;
        timeLabels.push({ date, label });
      } else if (interval === "month") {
        date.setMonth(date.getMonth() - i);
        const label = date.toLocaleString('default', { month: 'short' });
        timeLabels.push({ date, label });
      }
    }
    
    // Count work orders by period
    timeLabels.forEach(period => {
      let startDate = new Date(period.date);
      let endDate;
      
      if (interval === "day") {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (interval === "week") {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else if (interval === "month") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      const completedCount = workOrders.filter(wo => {
        if (wo.status !== "completed" || !wo.dateCompleted) return false;
        const completedDate = new Date(wo.dateCompleted);
        return completedDate >= startDate && completedDate < endDate!;
      }).length;
      
      const createdCount = workOrders.filter(wo => {
        const createdDate = new Date(wo.dateCreated);
        return createdDate >= startDate && createdDate < endDate!;
      }).length;
      
      completedByPeriod.push(completedCount);
      createdByPeriod.push(createdCount);
    });
    
    return timeLabels.map((period, index) => ({
      name: period.label,
      Created: createdByPeriod[index],
      Completed: completedByPeriod[index],
    }));
  };

  // Prepare inventory value by category
  const inventoryValueByCategory = () => {
    if (!inventoryItems || !inventoryItems.length) return [];
    
    // Group inventory items by category
    const categories = new Map();
    
    inventoryItems.forEach(item => {
      const categoryId = item.categoryId || 0;
      const categoryName = item.category?.name || "Uncategorized";
      const value = parseFloat(item.unitCost || "0") * item.quantityInStock;
      
      if (categories.has(categoryId)) {
        categories.set(categoryId, {
          name: categoryName,
          value: categories.get(categoryId).value + value
        });
      } else {
        categories.set(categoryId, { name: categoryName, value });
      }
    });
    
    const result = Array.from(categories.values())
      .sort((a, b) => b.value - a.value) // Sort by value descending
      .slice(0, 5); // Top 5 categories
    
    // Add colors
    const colors = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#eab308", "#dc2626"];
    return result.map((item, index) => ({
      ...item,
      value: parseFloat(item.value.toFixed(2)),
      color: colors[index % colors.length]
    }));
  };

  const isLoading = isLoadingWorkOrders || isLoadingAssets || isLoadingInventory;

  // Generate asset category options for filter
  const assetTypeOptions = assets ? 
    Array.from(new Set(assets.map(asset => asset.typeId)))
      .filter(typeId => typeId !== null)
      .map(typeId => {
        const asset = assets.find(a => a.typeId === typeId);
        return {
          id: typeId,
          name: asset?.type?.name || `Type ${typeId}`
        };
      }) : [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Reports
        </h2>
        <div className="grid gap-4 grid-cols-1">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Reports
        </h2>
        
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last90days">Last 90 days</SelectItem>
              <SelectItem value="last12months">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workOrders">Work Orders</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Work Orders Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Work Order Timeline
              </CardTitle>
              <CardDescription>
                Created vs. completed work orders over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={workOrderTimeline()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Created" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Completed" 
                      stroke="#16a34a" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Work Orders by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Work Orders by Status
                </CardTitle>
                <CardDescription>
                  Distribution of work orders by current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workOrderByStatus()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {workOrderByStatus().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} work orders`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Inventory Value by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChartIcon className="h-5 w-5" />
                  Top Inventory Value by Category
                </CardTitle>
                <CardDescription>
                  Categories with highest total inventory value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={inventoryValueByCategory()}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        formatter={(value) => [`$${value}`, 'Value']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {inventoryValueByCategory().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="workOrders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work Order Performance</CardTitle>
              <CardDescription>Key metrics for work order management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Total Work Orders</h3>
                  <p className="text-2xl font-bold">{workOrders?.length || 0}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-500 mb-2">Completion Rate</h3>
                  <p className="text-2xl font-bold">
                    {workOrders && workOrders.length > 0
                      ? Math.round((workOrders.filter(wo => wo.status === "completed").length / workOrders.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-500 mb-2">On-Time Completion</h3>
                  <p className="text-2xl font-bold">
                    {workOrders && workOrders.length > 0
                      ? Math.round((workOrders.filter(wo => 
                          wo.status === "completed" && 
                          wo.dateNeeded && 
                          new Date(wo.dateCompleted || "") <= new Date(wo.dateNeeded)
                        ).length / 
                        workOrders.filter(wo => wo.status === "completed").length) * 100) || 0
                      : 0}%
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-500 mb-2">Avg. Resolution Time</h3>
                  <p className="text-2xl font-bold">
                    {workOrders && workOrders.filter(wo => wo.status === "completed" && wo.dateCompleted).length > 0
                      ? Math.round(workOrders
                          .filter(wo => wo.status === "completed" && wo.dateCompleted)
                          .reduce((sum, wo) => {
                            const created = new Date(wo.dateCreated);
                            const completed = new Date(wo.dateCompleted!);
                            return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
                          }, 0) / 
                          workOrders.filter(wo => wo.status === "completed" && wo.dateCompleted).length
                        )
                      : 0} days
                  </p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={workOrderTimeline()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Created" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Completed" 
                      stroke="#16a34a" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Asset Performance Analysis</h3>
            <Select value={assetCategory} onValueChange={setAssetCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Asset category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {assetTypeOptions.map(type => (
                  <SelectItem key={type.id} value={type.id?.toString() || "0"}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Assets by Status
                </CardTitle>
                <CardDescription>Distribution of assets by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetsByStatus()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {assetsByStatus().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} assets`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChartIcon className="h-5 w-5" />
                  Assets with Most Work Orders
                </CardTitle>
                <CardDescription>Top 5 assets requiring the most maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {workOrders && workOrders.length > 0 && assets && assets.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={
                          assets
                            .map(asset => {
                              const woCount = workOrders.filter(wo => wo.assetId === asset.id).length;
                              return {
                                name: asset.assetNumber,
                                description: asset.name,
                                value: woCount,
                                color: "#3b82f6"
                              };
                            })
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 5)
                        }
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category"
                          width={80}
                          tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                        />
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} work orders`, 
                            props.payload.description
                          ]}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No work order data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asset Health Metrics</CardTitle>
              <CardDescription>Overall health indicators for your asset fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Total Assets</h3>
                  <p className="text-2xl font-bold">{assets?.length || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-500 mb-2">Uptime Rate</h3>
                  <p className="text-2xl font-bold">
                    {assets && assets.length > 0
                      ? Math.round((assets.filter(a => a.status === "operational").length / assets.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-500 mb-2">Maintenance Rate</h3>
                  <p className="text-2xl font-bold">
                    {assets && assets.length > 0 && workOrders && workOrders.length > 0
                      ? Math.round((assets.filter(a => 
                          workOrders.some(wo => wo.assetId === a.id && wo.maintenanceType === "preventive")
                        ).length / assets.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-500 mb-2">MTTR</h3>
                  <p className="text-2xl font-bold">
                    {workOrders && workOrders.filter(wo => 
                      wo.status === "completed" && 
                      wo.dateCompleted && 
                      wo.assetId !== null
                    ).length > 0
                      ? Math.round(workOrders
                          .filter(wo => wo.status === "completed" && wo.dateCompleted && wo.assetId !== null)
                          .reduce((sum, wo) => {
                            const created = new Date(wo.dateCreated);
                            const completed = new Date(wo.dateCompleted!);
                            return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
                          }, 0) / 
                          workOrders.filter(wo => wo.status === "completed" && wo.dateCompleted && wo.assetId !== null).length
                        )
                      : 0} hrs
                  </p>
                  <p className="text-xs text-blue-600">Mean time to repair</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory Valuation</CardTitle>
              <CardDescription>Current inventory value and stock metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Total Items</h3>
                  <p className="text-2xl font-bold">{inventoryItems?.length || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-500 mb-2">Total Inventory Value</h3>
                  <p className="text-2xl font-bold">
                    ${inventoryItems
                      ? inventoryItems.reduce((sum, item) => {
                          const cost = parseFloat(item.unitCost || "0");
                          return sum + (cost * item.quantityInStock);
                        }, 0).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-500 mb-2">Low Stock Items</h3>
                  <p className="text-2xl font-bold">
                    {inventoryItems 
                      ? inventoryItems.filter(item => 
                          item.quantityInStock <= (item.reorderPoint || 0)
                        ).length
                      : 0}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-500 mb-2">Active Categories</h3>
                  <p className="text-2xl font-bold">
                    {inventoryItems 
                      ? new Set(inventoryItems
                          .filter(item => item.categoryId !== null)
                          .map(item => item.categoryId)
                        ).size
                      : 0}
                  </p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={inventoryValueByCategory()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Value']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {inventoryValueByCategory().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}