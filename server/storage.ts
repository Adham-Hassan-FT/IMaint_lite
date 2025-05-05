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
  AssetWithDetails, InventoryItemWithDetails
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assetTypes: Map<number, AssetType>;
  private assets: Map<number, Asset>;
  private inventoryCategories: Map<number, InventoryCategory>;
  private inventoryItems: Map<number, InventoryItem>;
  private workOrderTypes: Map<number, WorkOrderType>;
  private workOrders: Map<number, WorkOrder>;
  private workOrderLabor: Map<number, WorkOrderLabor>;
  private workOrderParts: Map<number, WorkOrderPart>;

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
  };

  constructor() {
    this.users = new Map();
    this.assetTypes = new Map();
    this.assets = new Map();
    this.inventoryCategories = new Map();
    this.inventoryItems = new Map();
    this.workOrderTypes = new Map();
    this.workOrders = new Map();
    this.workOrderLabor = new Map();
    this.workOrderParts = new Map();

    this.currentIds = {
      users: 1,
      assetTypes: 1,
      assets: 1,
      inventoryCategories: 1,
      inventoryItems: 1,
      workOrderTypes: 1,
      workOrders: 1,
      workOrderLabor: 1,
      workOrderParts: 1
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
    this.createAsset({
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
    
    this.createAsset({
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
    
    this.createAsset({
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
    this.createInventoryItem({
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
    
    this.createInventoryItem({
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
    
    this.createInventoryItem({
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
    const asset = Array.from(this.assets.values())[0];
    const admin = Array.from(this.users.values())[0];
    const tech = Array.from(this.users.values())[1];

    const workOrder1 = this.createWorkOrder({
      workOrderNumber: "WO-001",
      title: "Scheduled Maintenance",
      description: "Perform scheduled preventive maintenance on Production Line A",
      typeId: preventiveType.id,
      assetId: asset.id,
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
    const item = Array.from(this.inventoryItems.values())[1]; // Drive Belt
    this.createWorkOrderPart({
      workOrderId: workOrder1.id,
      inventoryItemId: item.id,
      quantity: 1,
      unitCost: item.unitCost,
      totalCost: item.unitCost,
      dateIssued: new Date()
    });
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
    
    const laborEntries = await this.listWorkOrderLabor(id);
    
    const parts = await this.listWorkOrderParts(id);
    const partsWithItems = await Promise.all(parts.map(async part => {
      const inventoryItem = part.inventoryItemId ? 
        await this.getInventoryItem(part.inventoryItemId) : 
        undefined;
      
      return { ...part, inventoryItem };
    }));

    return {
      ...workOrder,
      asset,
      requestedBy,
      assignedTo,
      type,
      laborEntries,
      parts: partsWithItems
    };
  }

  async listWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
  }

  async listWorkOrdersWithDetails(): Promise<WorkOrderWithDetails[]> {
    const workOrders = await this.listWorkOrders();
    return Promise.all(workOrders.map(wo => 
      this.getWorkOrderDetails(wo.id) as Promise<WorkOrderWithDetails>
    ));
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
    
    // Update inventory quantity
    const inventoryItem = await this.getInventoryItem(part.inventoryItemId);
    if (inventoryItem) {
      await this.updateInventoryItem(part.inventoryItemId, {
        quantityInStock: inventoryItem.quantityInStock - part.quantity
      });
    }
    
    return part;
  }

  async listWorkOrderParts(workOrderId: number): Promise<WorkOrderPart[]> {
    return Array.from(this.workOrderParts.values())
      .filter(part => part.workOrderId === workOrderId);
  }
}

export const storage = new MemStorage();
