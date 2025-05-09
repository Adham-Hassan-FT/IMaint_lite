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
  pmWorkOrders, PmWorkOrder, InsertPmWorkOrder,
  notifications, Notification, InsertNotification
} from "@shared/schema";

// Define document types
export interface Document {
  id: number;
  filename: string;
  filesize: number;
  contentType: string;
  entityType: string;
  entityId: number;
  filePath: string;
  uploadDate: Date;
}

export type InsertDocument = Omit<Document, 'id'>;

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
  
  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(entityType: string, entityId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
}