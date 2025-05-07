import {
  users, User, InsertUser,
  assetTypes, AssetType, InsertAssetType,
  assets, Asset, InsertAsset,
  inventoryCategories, InventoryCategory, InsertInventoryCategory,
  inventoryItems, InventoryItem, InsertInventoryItem,
  workOrderTypes, WorkOrderType, InsertWorkOrderType,
  workOrders, WorkOrder, InsertWorkOrder, WorkOrderWithDetails,
  workOrderLabor, WorkOrderLabor, InsertWorkOrderLabor,
  workOrderParts, WorkOrderPart, InsertWorkOrderPart,
  AssetWithDetails, InventoryItemWithDetails,
  workRequests, WorkRequest, InsertWorkRequest, WorkRequestWithDetails,
  preventiveMaintenance, PreventiveMaintenance, InsertPreventiveMaintenance, PreventiveMaintenanceWithDetails,
  pmTechnicians, PmTechnician, InsertPmTechnician,
  pmWorkOrders, PmWorkOrder, InsertPmWorkOrder
} from "@shared/schema";
import crypto from "crypto";

// Interface for all storage operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Asset Types
  getAssetType(id: number): Promise<AssetType | undefined>;
  listAssetTypes(): Promise<AssetType[]>;
  createAssetType(assetType: InsertAssetType): Promise<AssetType>;
  
  // Assets
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetByNumber(assetNumber: string): Promise<Asset | undefined>;
  getAssetDetails(id: number): Promise<AssetWithDetails | undefined>;
  listAssets(): Promise<Asset[]>;
  listAssetsWithDetails(): Promise<AssetWithDetails[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  
  // Inventory Categories
  getInventoryCategory(id: number): Promise<InventoryCategory | undefined>;
  listInventoryCategories(): Promise<InventoryCategory[]>;
  createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory>;
  
  // Inventory Items
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getInventoryItemByPartNumber(partNumber: string): Promise<InventoryItem | undefined>;
  getInventoryItemDetails(id: number): Promise<InventoryItemWithDetails | undefined>;
  listInventoryItems(): Promise<InventoryItem[]>;
  listInventoryItemsWithDetails(): Promise<InventoryItemWithDetails[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  
  // Work Order Types
  getWorkOrderType(id: number): Promise<WorkOrderType | undefined>;
  listWorkOrderTypes(): Promise<WorkOrderType[]>;
  createWorkOrderType(type: InsertWorkOrderType): Promise<WorkOrderType>;
  
  // Work Orders
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  getWorkOrderByNumber(number: string): Promise<WorkOrder | undefined>;
  getWorkOrderDetails(id: number): Promise<WorkOrderWithDetails | undefined>;
  listWorkOrders(): Promise<WorkOrder[]>;
  listWorkOrdersWithDetails(): Promise<WorkOrderWithDetails[]>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  
  // Work Order Labor
  createWorkOrderLabor(labor: InsertWorkOrderLabor): Promise<WorkOrderLabor>;
  listWorkOrderLabor(workOrderId: number): Promise<WorkOrderLabor[]>;
  
  // Work Order Parts
  createWorkOrderPart(part: InsertWorkOrderPart): Promise<WorkOrderPart>;
  listWorkOrderParts(workOrderId: number): Promise<WorkOrderPart[]>;

  // Work Requests
  getWorkRequest(id: number): Promise<WorkRequest | undefined>;
  getWorkRequestByNumber(number: string): Promise<WorkRequest | undefined>;
  getWorkRequestDetails(id: number): Promise<WorkRequestWithDetails | undefined>;
  listWorkRequests(): Promise<WorkRequest[]>;
  listWorkRequestsWithDetails(): Promise<WorkRequestWithDetails[]>;
  createWorkRequest(workRequest: InsertWorkRequest): Promise<WorkRequest>;
  updateWorkRequest(id: number, workRequest: Partial<InsertWorkRequest>): Promise<WorkRequest | undefined>;
  convertWorkRequestToWorkOrder(id: number, workOrderData?: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;

  // Preventive Maintenance
  getPreventiveMaintenance(id: number): Promise<PreventiveMaintenance | undefined>;
  getPreventiveMaintenanceDetails(id: number): Promise<PreventiveMaintenanceWithDetails | undefined>;
  listPreventiveMaintenances(): Promise<PreventiveMaintenance[]>;
  listPreventiveMaintenancesWithDetails(): Promise<PreventiveMaintenanceWithDetails[]>;
  createPreventiveMaintenance(pm: InsertPreventiveMaintenance): Promise<PreventiveMaintenance>;
  updatePreventiveMaintenance(id: number, pm: Partial<InsertPreventiveMaintenance>): Promise<PreventiveMaintenance | undefined>;

  // PM Technicians
  assignTechnicians(pmId: number, technicianIds: number[]): Promise<PmTechnician[]>;
  removeTechnician(pmId: number, technicianId: number): Promise<boolean>;
  listTechniciansForPM(pmId: number): Promise<User[]>;

  // PM Work Orders
  generateWorkOrdersFromPM(pmId: number): Promise<PmWorkOrder[]>;
  getWorkOrdersForPM(pmId: number): Promise<(PmWorkOrder & { workOrder: WorkOrder })[]>;
  
  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  listNotificationsForUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markNotificationAsDismissed(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  countUnreadNotifications(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // Private fields
  private users: Map<number, User> = new Map();
  private assetTypes: Map<number, AssetType> = new Map();
  private assets: Map<number, Asset> = new Map();
  private inventoryCategories: Map<number, InventoryCategory> = new Map();
  private inventoryItems: Map<number, InventoryItem> = new Map();
  private workOrderTypes: Map<number, WorkOrderType> = new Map();
  private workOrders: Map<number, WorkOrder> = new Map();
  private workOrderLabor: Map<number, WorkOrderLabor> = new Map();
  private workOrderParts: Map<number, WorkOrderPart> = new Map();
  private workRequests: Map<number, WorkRequest> = new Map();
  private preventiveMaintenance: Map<number, PreventiveMaintenance> = new Map();
  private pmTechnicians: Map<number, PmTechnician> = new Map();
  private pmWorkOrders: Map<number, PmWorkOrder> = new Map();
  private notifications: Map<number, Notification> = new Map();

  private currentIds: {
    users: number;
    assetTypes: number;
    assets: number;
    inventoryCategories: number;
    inventoryItems: number;
    workOrderTypes: number;
    workOrders: number;
    workOrderLabor: number;
    workOrderParts: number;
    workRequests: number;
    preventiveMaintenance: number;
    pmTechnicians: number;
    pmWorkOrders: number;
    notifications: number;
  };

  constructor() {
    this.currentIds = {
      users: 1,
      assetTypes: 1,
      assets: 1,
      inventoryCategories: 1,
      inventoryItems: 1,
      workOrderTypes: 1,
      workOrders: 1,
      workOrderLabor: 1,
      workOrderParts: 1,
      workRequests: 1,
      preventiveMaintenance: 1,
      pmTechnicians: 1,
      pmWorkOrders: 1,
      notifications: 1
    };

    // Seed initial data
    this.seedData();
  }

  // Helper method to seed initial data
  private seedData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: this.hashPassword("admin123"),
      fullName: "Admin User",
      email: "admin@imaint.com",
      role: "admin",
      isActive: true
    });

    // Create technician user
    this.createUser({
      username: "tech",
      password: this.hashPassword("tech123"),
      fullName: "Technician User",
      email: "tech@imaint.com",
      role: "technician",
      isActive: true
    });
    
    // Create manager user
    this.createUser({
      username: "manager",
      password: this.hashPassword("manager123"),
      fullName: "Manager User",
      email: "manager@imaint.com",
      role: "manager",
      isActive: true
    });

    // Create requester user
    this.createUser({
      username: "requester",
      password: this.hashPassword("requester123"),
      fullName: "Requester User",
      email: "requester@imaint.com",
      role: "requester",
      isActive: true
    });

    // Create asset types
    const machineType = this.createAssetType({
      name: "Machine",
      description: "Production machinery and equipment"
    });
    
    const vehicleType = this.createAssetType({
      name: "Vehicle",
      description: "Company vehicles and transportation equipment"
    });
    
    const facilityType = this.createAssetType({
      name: "Facility",
      description: "Buildings and facilities"
    });

    // Create assets
    const asset1 = this.createAsset({
      assetNumber: "A-001",
      description: "Production Line A",
      typeId: machineType.id,
      status: "operational",
      location: "Main Plant - Floor 1",
      manufacturer: "Industrial Systems Inc.",
      model: "PL2000",
      serialNumber: "PL2000-123456",
      barcode: "A001-BARCODE"
    });
    
    const asset2 = this.createAsset({
      assetNumber: "A-002",
      description: "Delivery Truck",
      typeId: vehicleType.id,
      status: "operational",
      location: "Garage",
      manufacturer: "Truck Co.",
      model: "Delivery 5000",
      serialNumber: "TR5000-789012",
      barcode: "A002-BARCODE"
    });
    
    const asset3 = this.createAsset({
      assetNumber: "A-003",
      description: "Main Office Building",
      typeId: facilityType.id,
      status: "operational",
      location: "123 Main Street",
      barcode: "A003-BARCODE"
    });

    // Create inventory categories
    const electricalCategory = this.createInventoryCategory({
      name: "Electrical",
      description: "Electrical components and supplies"
    });
    
    const mechanicalCategory = this.createInventoryCategory({
      name: "Mechanical",
      description: "Mechanical parts and components"
    });
    
    const consumablesCategory = this.createInventoryCategory({
      name: "Consumables",
      description: "Consumable supplies"
    });

    // Create inventory items
    const item1 = this.createInventoryItem({
      partNumber: "P-001",
      name: "Electric Motor",
      description: "10HP Electric Motor",
      categoryId: electricalCategory.id,
      unitCost: 450.0,
      quantityInStock: 5,
      reorderPoint: 2,
      location: "Warehouse A - Shelf 1",
      barcode: "P001-BARCODE"
    });
    
    const item2 = this.createInventoryItem({
      partNumber: "P-002",
      name: "Drive Belt",
      description: "Industrial Drive Belt",
      categoryId: mechanicalCategory.id,
      unitCost: 75.0,
      quantityInStock: 12,
      reorderPoint: 5,
      location: "Warehouse A - Shelf 2",
      barcode: "P002-BARCODE"
    });
    
    const item3 = this.createInventoryItem({
      partNumber: "P-003",
      name: "Lubricant",
      description: "Industrial Lubricant 1L",
      categoryId: consumablesCategory.id,
      unitCost: 25.0,
      quantityInStock: 20,
      reorderPoint: 10,
      location: "Warehouse B - Shelf 3",
      barcode: "P003-BARCODE"
    });

    // Create work order types
    const preventiveType = this.createWorkOrderType({
      name: "Preventive",
      description: "Scheduled preventive maintenance"
    });
    
    const correctiveType = this.createWorkOrderType({
      name: "Corrective",
      description: "Repairs and corrections for failures"
    });
    
    const projectType = this.createWorkOrderType({
      name: "Project",
      description: "Installation or modification projects"
    });

    // Create work orders
    const admin = Array.from(this.users.values()).find(u => u.username === 'admin')!;
    const tech = Array.from(this.users.values()).find(u => u.username === 'tech')!;
    const manager = Array.from(this.users.values()).find(u => u.username === 'manager')!;
    const requester = Array.from(this.users.values()).find(u => u.username === 'requester')!;

    const workOrder1 = this.createWorkOrder({
      workOrderNumber: "WO-001",
      title: "Scheduled Maintenance",
      description: "Perform scheduled preventive maintenance on Production Line A",
      typeId: preventiveType.id,
      assetId: asset1.id,
      priority: "medium",
      status: "scheduled",
      requestedById: admin.id,
      assignedToId: tech.id,
      dateRequested: new Date(),
      dateNeeded: this.addDays(new Date(), 7),
      dateScheduled: this.addDays(new Date(), 5),
      estimatedHours: 4,
      estimatedCost: 300
    });

    // Add labor to work order
    this.createWorkOrderLabor({
      workOrderId: workOrder1.id,
      userId: tech.id,
      hours: 2,
      laborCost: 120,
      datePerformed: this.addDays(new Date(), -1),
      notes: "Initial inspection completed"
    });

    // Add parts to work order
    this.createWorkOrderPart({
      workOrderId: workOrder1.id,
      inventoryItemId: item2.id,
      quantity: 1,
      unitCost: item2.unitCost,
      totalCost: item2.unitCost,
      dateIssued: new Date()
    });
    
    // Create Work Request
    this.createWorkRequest({
      requestNumber: "WR-001",
      title: "HVAC Not Working",
      description: "The HVAC system in the main office is not cooling properly",
      assetId: asset3.id,
      priority: "high",
      requestedById: requester.id,
      dateRequested: new Date(),
      dateNeeded: this.addDays(new Date(), 2),
      location: "Main Office - 2nd Floor",
      notes: "Temperature is reaching 85°F in the afternoon"
    });
    
    // Create Preventive Maintenance Schedule
    const pm1 = this.createPreventiveMaintenance({
      title: "Monthly Production Line Inspection",
      description: "Regular monthly inspection of all production line components",
      assetId: asset1.id,
      maintenanceType: "inspection",
      priority: "medium",
      startDate: this.addDays(new Date(), 14),
      duration: 2, // 2 hours
      createdById: manager.id,
      isRecurring: true,
      recurringPeriod: "monthly",
      occurrences: 12, // 12 months
      notes: "Check all belts, motors, and safety systems"
    });
    
    // Assign technicians to PM
    this.assignTechnicians(pm1.id, [tech.id]);
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Asset Types
  async getAssetType(id: number): Promise<AssetType | undefined> {
    return this.assetTypes.get(id);
  }

  async listAssetTypes(): Promise<AssetType[]> {
    return Array.from(this.assetTypes.values());
  }

  async createAssetType(insertAssetType: InsertAssetType): Promise<AssetType> {
    const id = this.currentIds.assetTypes++;
    const assetType: AssetType = { ...insertAssetType, id };
    this.assetTypes.set(id, assetType);
    return assetType;
  }

  // Assets
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assets.get(id);
  }

  async getAssetByNumber(assetNumber: string): Promise<Asset | undefined> {
    return Array.from(this.assets.values()).find(asset => asset.assetNumber === assetNumber);
  }

  async getAssetDetails(id: number): Promise<AssetWithDetails | undefined> {
    const asset = await this.getAsset(id);
    if (!asset) return undefined;

    const assetType = asset.typeId ? await this.getAssetType(asset.typeId) : undefined;
    const parentAsset = asset.parentId ? await this.getAsset(asset.parentId) : undefined;
    
    const workOrders = Array.from(this.workOrders.values())
      .filter(wo => wo.assetId === id);

    return {
      ...asset,
      type: assetType,
      parent: parentAsset,
      workOrders
    };
  }

  async listAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }

  async listAssetsWithDetails(): Promise<AssetWithDetails[]> {
    const assets = await this.listAssets();
    return Promise.all(assets.map(asset => this.getAssetDetails(asset.id) as Promise<AssetWithDetails>));
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.currentIds.assets++;
    const asset: Asset = { ...insertAsset, id };
    this.assets.set(id, asset);
    return asset;
  }

  async updateAsset(id: number, assetData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const existingAsset = await this.getAsset(id);
    if (!existingAsset) return undefined;
    
    const updatedAsset = { ...existingAsset, ...assetData };
    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }

  // Inventory Categories
  async getInventoryCategory(id: number): Promise<InventoryCategory | undefined> {
    return this.inventoryCategories.get(id);
  }

  async listInventoryCategories(): Promise<InventoryCategory[]> {
    return Array.from(this.inventoryCategories.values());
  }

  async createInventoryCategory(insertCategory: InsertInventoryCategory): Promise<InventoryCategory> {
    const id = this.currentIds.inventoryCategories++;
    const category: InventoryCategory = { ...insertCategory, id };
    this.inventoryCategories.set(id, category);
    return category;
  }

  // Inventory Items
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async getInventoryItemByPartNumber(partNumber: string): Promise<InventoryItem | undefined> {
    return Array.from(this.inventoryItems.values()).find(item => item.partNumber === partNumber);
  }

  async getInventoryItemDetails(id: number): Promise<InventoryItemWithDetails | undefined> {
    const item = await this.getInventoryItem(id);
    if (!item) return undefined;

    const category = item.categoryId ? await this.getInventoryCategory(item.categoryId) : undefined;
    
    return {
      ...item,
      category
    };
  }

  async listInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async listInventoryItemsWithDetails(): Promise<InventoryItemWithDetails[]> {
    const items = await this.listInventoryItems();
    return Promise.all(items.map(item => this.getInventoryItemDetails(item.id) as Promise<InventoryItemWithDetails>));
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentIds.inventoryItems++;
    const item: InventoryItem = { ...insertItem, id };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: number, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existingItem = await this.getInventoryItem(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...itemData };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  // Work Order Types
  async getWorkOrderType(id: number): Promise<WorkOrderType | undefined> {
    return this.workOrderTypes.get(id);
  }

  async listWorkOrderTypes(): Promise<WorkOrderType[]> {
    return Array.from(this.workOrderTypes.values());
  }

  async createWorkOrderType(insertType: InsertWorkOrderType): Promise<WorkOrderType> {
    const id = this.currentIds.workOrderTypes++;
    const type: WorkOrderType = { ...insertType, id };
    this.workOrderTypes.set(id, type);
    return type;
  }

  // Work Orders
  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }

  async getWorkOrderByNumber(number: string): Promise<WorkOrder | undefined> {
    return Array.from(this.workOrders.values()).find(wo => wo.workOrderNumber === number);
  }

  async getWorkOrderDetails(id: number): Promise<WorkOrderWithDetails | undefined> {
    const workOrder = await this.getWorkOrder(id);
    if (!workOrder) return undefined;

    const asset = workOrder.assetId ? await this.getAsset(workOrder.assetId) : undefined;
    const requestedBy = workOrder.requestedById ? await this.getUser(workOrder.requestedById) : undefined;
    const assignedTo = workOrder.assignedToId ? await this.getUser(workOrder.assignedToId) : undefined;
    const type = workOrder.typeId ? await this.getWorkOrderType(workOrder.typeId) : undefined;
    
    const laborEntries = Array.from(this.workOrderLabor.values())
      .filter(labor => labor.workOrderId === id);
    
    const parts = await Promise.all(
      Array.from(this.workOrderParts.values())
        .filter(part => part.workOrderId === id)
        .map(async part => {
          const inventoryItem = part.inventoryItemId ? 
            await this.getInventoryItem(part.inventoryItemId) : 
            undefined;
          return { ...part, inventoryItem };
        })
    );

    return {
      ...workOrder,
      asset,
      requestedBy,
      assignedTo,
      type,
      laborEntries,
      parts
    };
  }

  async listWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
  }

  async listWorkOrdersWithDetails(): Promise<WorkOrderWithDetails[]> {
    const workOrders = await this.listWorkOrders();
    return Promise.all(workOrders.map(wo => this.getWorkOrderDetails(wo.id) as Promise<WorkOrderWithDetails>));
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = this.currentIds.workOrders++;
    const workOrder: WorkOrder = { ...insertWorkOrder, id };
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  async updateWorkOrder(id: number, workOrderData: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const existingWorkOrder = await this.getWorkOrder(id);
    if (!existingWorkOrder) return undefined;
    
    const updatedWorkOrder = { ...existingWorkOrder, ...workOrderData };
    this.workOrders.set(id, updatedWorkOrder);
    return updatedWorkOrder;
  }

  // Work Order Labor
  async createWorkOrderLabor(insertLabor: InsertWorkOrderLabor): Promise<WorkOrderLabor> {
    const id = this.currentIds.workOrderLabor++;
    const labor: WorkOrderLabor = { ...insertLabor, id };
    this.workOrderLabor.set(id, labor);
    return labor;
  }

  async listWorkOrderLabor(workOrderId: number): Promise<WorkOrderLabor[]> {
    return Array.from(this.workOrderLabor.values())
      .filter(labor => labor.workOrderId === workOrderId);
  }

  // Work Order Parts
  async createWorkOrderPart(insertPart: InsertWorkOrderPart): Promise<WorkOrderPart> {
    const id = this.currentIds.workOrderParts++;
    const part: WorkOrderPart = { ...insertPart, id };
    this.workOrderParts.set(id, part);
    return part;
  }

  async listWorkOrderParts(workOrderId: number): Promise<WorkOrderPart[]> {
    return Array.from(this.workOrderParts.values())
      .filter(part => part.workOrderId === workOrderId);
  }

  // Work Request Implementation
  async getWorkRequest(id: number): Promise<WorkRequest | undefined> {
    return this.workRequests.get(id);
  }

  async getWorkRequestByNumber(number: string): Promise<WorkRequest | undefined> {
    return Array.from(this.workRequests.values()).find(wr => wr.requestNumber === number);
  }

  async getWorkRequestDetails(id: number): Promise<WorkRequestWithDetails | undefined> {
    const workRequest = await this.getWorkRequest(id);
    if (!workRequest) return undefined;

    const asset = workRequest.assetId ? await this.getAsset(workRequest.assetId) : undefined;
    const requestedBy = workRequest.requestedById ? await this.getUser(workRequest.requestedById) : undefined;
    const convertedToWorkOrder = workRequest.convertedToWorkOrderId 
      ? await this.getWorkOrder(workRequest.convertedToWorkOrderId) 
      : undefined;

    return {
      ...workRequest,
      asset,
      requestedBy,
      convertedToWorkOrder
    };
  }

  async listWorkRequests(): Promise<WorkRequest[]> {
    return Array.from(this.workRequests.values());
  }

  async listWorkRequestsWithDetails(): Promise<WorkRequestWithDetails[]> {
    const workRequests = await this.listWorkRequests();
    return Promise.all(workRequests.map(wr => this.getWorkRequestDetails(wr.id) as Promise<WorkRequestWithDetails>));
  }

  async createWorkRequest(insertWorkRequest: InsertWorkRequest): Promise<WorkRequest> {
    const id = this.currentIds.workRequests++;
    // Ensure required fields are set
    const workRequest: WorkRequest = { 
      ...insertWorkRequest, 
      id, 
      status: insertWorkRequest.status || 'requested',
      isConverted: insertWorkRequest.isConverted || false,
      dateRequested: insertWorkRequest.dateRequested || new Date(),
      location: insertWorkRequest.location || null,
      notes: insertWorkRequest.notes || null,
      convertedToWorkOrderId: insertWorkRequest.convertedToWorkOrderId || null
    };
    this.workRequests.set(id, workRequest);
    return workRequest;
  }

  async updateWorkRequest(id: number, workRequestData: Partial<InsertWorkRequest>): Promise<WorkRequest | undefined> {
    const existingRequest = await this.getWorkRequest(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { ...existingRequest, ...workRequestData };
    this.workRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async convertWorkRequestToWorkOrder(id: number, workOrderData?: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const workRequest = await this.getWorkRequest(id);
    if (!workRequest) return undefined;
    
    // Generate a work order number
    const woCount = this.workOrders.size;
    const workOrderNumber = `WO-${String(woCount + 1).padStart(3, '0')}`;
    
    // Create the work order from the work request
    const workOrder = await this.createWorkOrder({
      workOrderNumber,
      title: workRequest.title,
      description: workRequest.description,
      assetId: workRequest.assetId,
      priority: workRequest.priority,
      status: 'approved', // Set default status to approved since it was a request
      requestedById: workRequest.requestedById,
      dateRequested: workRequest.dateRequested,
      dateNeeded: workRequest.dateNeeded,
      ...workOrderData
    });
    
    // Update the work request to mark as converted
    await this.updateWorkRequest(id, {
      isConverted: true,
      convertedToWorkOrderId: workOrder.id,
      status: 'completed' // Mark the request as completed
    });
    
    return workOrder;
  }

  // Preventive Maintenance Implementation
  async getPreventiveMaintenance(id: number): Promise<PreventiveMaintenance | undefined> {
    return this.preventiveMaintenance.get(id);
  }

  async getPreventiveMaintenanceDetails(id: number): Promise<PreventiveMaintenanceWithDetails | undefined> {
    const pm = await this.getPreventiveMaintenance(id);
    if (!pm) return undefined;

    const asset = pm.assetId ? await this.getAsset(pm.assetId) : undefined;
    const createdBy = pm.createdById ? await this.getUser(pm.createdById) : undefined;
    
    // Get technicians assigned to this PM
    const technicianIds = Array.from(this.pmTechnicians.values())
      .filter(pmt => pmt.pmId === id)
      .map(pmt => pmt.technicianId);
    
    const technicians = await Promise.all(
      technicianIds.map(techId => this.getUser(techId) as Promise<User>)
    );
    
    // Get work orders generated from this PM
    const pmWorkOrdersList = Array.from(this.pmWorkOrders.values())
      .filter(pmwo => pmwo.pmId === id);
    
    const generatedWorkOrders = await Promise.all(
      pmWorkOrdersList.map(async pmwo => {
        const workOrder = await this.getWorkOrder(pmwo.workOrderId);
        return { ...pmwo, workOrder: workOrder! };
      })
    );

    return {
      ...pm,
      asset,
      createdBy,
      technicians,
      generatedWorkOrders
    };
  }

  async listPreventiveMaintenances(): Promise<PreventiveMaintenance[]> {
    return Array.from(this.preventiveMaintenance.values());
  }

  async listPreventiveMaintenancesWithDetails(): Promise<PreventiveMaintenanceWithDetails[]> {
    const pms = await this.listPreventiveMaintenances();
    return Promise.all(pms.map(pm => this.getPreventiveMaintenanceDetails(pm.id) as Promise<PreventiveMaintenanceWithDetails>));
  }

  async createPreventiveMaintenance(insertPM: InsertPreventiveMaintenance): Promise<PreventiveMaintenance> {
    const id = this.currentIds.preventiveMaintenance++;
    // Ensure required fields are set
    const pm: PreventiveMaintenance = { 
      ...insertPM, 
      id,
      isActive: insertPM.isActive ?? true,
      isRecurring: insertPM.isRecurring ?? false,
      dateCreated: insertPM.dateCreated || new Date(),
      assetId: insertPM.assetId || null,
      notes: insertPM.notes || null,
      recurringPeriod: insertPM.recurringPeriod || null,
      occurrences: insertPM.occurrences || null
    };
    this.preventiveMaintenance.set(id, pm);
    return pm;
  }

  async updatePreventiveMaintenance(id: number, pmData: Partial<InsertPreventiveMaintenance>): Promise<PreventiveMaintenance | undefined> {
    const existingPM = await this.getPreventiveMaintenance(id);
    if (!existingPM) return undefined;
    
    const updatedPM = { ...existingPM, ...pmData };
    this.preventiveMaintenance.set(id, updatedPM);
    return updatedPM;
  }

  // PM Technicians Implementation
  async assignTechnicians(pmId: number, technicianIds: number[]): Promise<PmTechnician[]> {
    // First remove any existing technicians
    const existingAssignments = Array.from(this.pmTechnicians.values())
      .filter(pmt => pmt.pmId === pmId);
    
    for (const assignment of existingAssignments) {
      this.pmTechnicians.delete(assignment.id);
    }
    
    // Now add the new technicians
    const result: PmTechnician[] = [];
    for (const techId of technicianIds) {
      const id = this.currentIds.pmTechnicians++;
      const pmTechnician: PmTechnician = {
        id,
        pmId,
        technicianId: techId
      };
      this.pmTechnicians.set(id, pmTechnician);
      result.push(pmTechnician);
    }
    
    return result;
  }

  async removeTechnician(pmId: number, technicianId: number): Promise<boolean> {
    const assignment = Array.from(this.pmTechnicians.values())
      .find(pmt => pmt.pmId === pmId && pmt.technicianId === technicianId);
    
    if (!assignment) return false;
    
    this.pmTechnicians.delete(assignment.id);
    return true;
  }

  async listTechniciansForPM(pmId: number): Promise<User[]> {
    const technicianIds = Array.from(this.pmTechnicians.values())
      .filter(pmt => pmt.pmId === pmId)
      .map(pmt => pmt.technicianId);
    
    return Promise.all(
      technicianIds.map(techId => this.getUser(techId) as Promise<User>)
    );
  }

  // PM Work Orders Implementation
  async generateWorkOrdersFromPM(pmId: number): Promise<PmWorkOrder[]> {
    const pm = await this.getPreventiveMaintenance(pmId);
    if (!pm) throw new Error(`Preventive maintenance schedule with ID ${pmId} not found`);
    
    // Get technicians assigned to this PM
    const technicians = await this.listTechniciansForPM(pmId);
    
    let workOrders: PmWorkOrder[] = [];
    
    // For one-time maintenance
    if (!pm.isRecurring) {
      // Generate work order number
      const woCount = this.workOrders.size;
      const workOrderNumber = `WO-${String(woCount + 1).padStart(3, '0')}`;
      
      // Create the work order
      const workOrder = await this.createWorkOrder({
        workOrderNumber,
        title: pm.title,
        description: pm.description,
        assetId: pm.assetId,
        priority: pm.priority,
        status: 'scheduled',
        requestedById: pm.createdById,
        assignedToId: technicians.length > 0 ? technicians[0].id : undefined,
        dateRequested: new Date(),
        dateScheduled: pm.startDate,
        estimatedHours: pm.duration
      });
      
      // Create PM work order link
      const pmWorkOrderId = this.currentIds.pmWorkOrders++;
      const pmWorkOrder: PmWorkOrder = {
        id: pmWorkOrderId,
        pmId,
        workOrderId: workOrder.id,
        scheduledDate: pm.startDate,
        occurrenceNumber: 1
      };
      
      this.pmWorkOrders.set(pmWorkOrderId, pmWorkOrder);
      workOrders.push(pmWorkOrder);
    } 
    // For recurring maintenance
    else if (pm.recurringPeriod && pm.occurrences) {
      for (let i = 0; i < pm.occurrences; i++) {
        // Calculate the scheduled date based on the recurring period
        let scheduledDate = new Date(pm.startDate);
        
        switch (pm.recurringPeriod) {
          case 'daily':
            scheduledDate.setDate(scheduledDate.getDate() + i);
            break;
          case 'weekly':
            scheduledDate.setDate(scheduledDate.getDate() + (i * 7));
            break;
          case 'biweekly':
            scheduledDate.setDate(scheduledDate.getDate() + (i * 14));
            break;
          case 'monthly':
            scheduledDate.setMonth(scheduledDate.getMonth() + i);
            break;
          case 'quarterly':
            scheduledDate.setMonth(scheduledDate.getMonth() + (i * 3));
            break;
          case 'semiannually':
            scheduledDate.setMonth(scheduledDate.getMonth() + (i * 6));
            break;
          case 'annually':
            scheduledDate.setFullYear(scheduledDate.getFullYear() + i);
            break;
        }
        
        // Generate work order number
        const woCount = this.workOrders.size;
        const workOrderNumber = `WO-${String(woCount + 1).padStart(3, '0')}`;
        
        // Create the work order
        const workOrder = await this.createWorkOrder({
          workOrderNumber,
          title: `${pm.title} (${i+1}/${pm.occurrences})`,
          description: pm.description,
          assetId: pm.assetId,
          priority: pm.priority,
          status: 'scheduled',
          requestedById: pm.createdById,
          assignedToId: technicians.length > 0 ? technicians[0].id : undefined,
          dateRequested: new Date(),
          dateScheduled: scheduledDate,
          estimatedHours: pm.duration
        });
        
        // Create PM work order link
        const pmWorkOrderId = this.currentIds.pmWorkOrders++;
        const pmWorkOrder: PmWorkOrder = {
          id: pmWorkOrderId,
          pmId,
          workOrderId: workOrder.id,
          scheduledDate,
          occurrenceNumber: i + 1
        };
        
        this.pmWorkOrders.set(pmWorkOrderId, pmWorkOrder);
        workOrders.push(pmWorkOrder);
      }
    }
    
    return workOrders;
  }

  async getWorkOrdersForPM(pmId: number): Promise<(PmWorkOrder & { workOrder: WorkOrder })[]> {
    const pmWorkOrders = Array.from(this.pmWorkOrders.values())
      .filter(pmwo => pmwo.pmId === pmId);
    
    return Promise.all(
      pmWorkOrders.map(async pmwo => {
        const workOrder = await this.getWorkOrder(pmwo.workOrderId);
        return { ...pmwo, workOrder: workOrder! };
      })
    );
  }

  // Notifications
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async listNotificationsForUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentIds.notifications++;
    const newNotification: Notification = { ...notification, id };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = await this.getNotification(id);
    if (!notification) return undefined;

    const updatedNotification: Notification = {
      ...notification,
      status: 'read',
      readAt: new Date()
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markNotificationAsDismissed(id: number): Promise<Notification | undefined> {
    const notification = await this.getNotification(id);
    if (!notification) return undefined;

    const updatedNotification: Notification = {
      ...notification,
      status: 'dismissed',
      dismissedAt: new Date()
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && notification.status === 'unread');
    
    const now = new Date();
    for (const notification of userNotifications) {
      const updatedNotification: Notification = {
        ...notification,
        status: 'read',
        readAt: now
      };
      this.notifications.set(notification.id, updatedNotification);
    }
  }

  async countUnreadNotifications(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && notification.status === 'unread')
      .length;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }
}

export const storage = new MemStorage();