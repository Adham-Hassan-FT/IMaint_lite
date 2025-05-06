import { pgTable, text, serial, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const workOrderStatusEnum = pgEnum('work_order_status', [
  'requested', 'approved', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled'
]);

export const workOrderPriorityEnum = pgEnum('work_order_priority', [
  'low', 'medium', 'high', 'critical'
]);

export const assetStatusEnum = pgEnum('asset_status', [
  'operational', 'non_operational', 'maintenance_required', 'retired'
]);

export const userRoleEnum = pgEnum('user_role', [
  'admin', 'manager', 'technician', 'requester', 'viewer'
]);

export const maintenanceTypeEnum = pgEnum('maintenance_type', [
  'inspection', 'service', 'calibration', 'replacement', 'testing', 'other'
]);

export const recurringPeriodEnum = pgEnum('recurring_period', [
  'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually', 'annually'
]);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default('viewer'),
  isActive: boolean("is_active").notNull().default(true),
  jobTitle: text("job_title"),
  department: text("department"),
  phone: text("phone"),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Asset Types
export const assetTypes = pgTable("asset_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertAssetTypeSchema = createInsertSchema(assetTypes).omit({ id: true });
export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>;
export type AssetType = typeof assetTypes.$inferSelect;

// Assets
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetNumber: text("asset_number").notNull().unique(),
  description: text("description").notNull(),
  typeId: integer("type_id").references(() => assetTypes.id),
  status: assetStatusEnum("status").notNull().default('operational'),
  parentId: integer("parent_id").references(() => assets.id),
  location: text("location"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  serialNumber: text("serial_number"),
  installDate: timestamp("install_date"),
  warrantyExpiration: timestamp("warranty_expiration"),
  replacementCost: decimal("replacement_cost", { precision: 10, scale: 2 }),
  criticalityRating: integer("criticality_rating"),
  lastServiceDate: timestamp("last_service_date"),
  barcode: text("barcode"),
});

export const insertAssetSchema = createInsertSchema(assets).omit({ id: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

// Inventory Categories
export const inventoryCategories = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertInventoryCategorySchema = createInsertSchema(inventoryCategories).omit({ id: true });
export type InsertInventoryCategory = z.infer<typeof insertInventoryCategorySchema>;
export type InventoryCategory = typeof inventoryCategories.$inferSelect;

// Inventory Items
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  partNumber: text("part_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => inventoryCategories.id),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  quantityInStock: integer("quantity_in_stock").notNull().default(0),
  reorderPoint: integer("reorder_point"),
  location: text("location"),
  barcode: text("barcode"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Work Order Types
export const workOrderTypes = pgTable("work_order_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertWorkOrderTypeSchema = createInsertSchema(workOrderTypes).omit({ id: true });
export type InsertWorkOrderType = z.infer<typeof insertWorkOrderTypeSchema>;
export type WorkOrderType = typeof workOrderTypes.$inferSelect;

// Work Orders
export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  workOrderNumber: text("work_order_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  typeId: integer("type_id").references(() => workOrderTypes.id),
  assetId: integer("asset_id").references(() => assets.id),
  priority: workOrderPriorityEnum("priority").notNull().default('medium'),
  status: workOrderStatusEnum("status").notNull().default('requested'),
  requestedById: integer("requested_by_id").references(() => users.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  dateRequested: timestamp("date_requested").notNull().defaultNow(),
  dateNeeded: timestamp("date_needed"),
  dateScheduled: timestamp("date_scheduled"),
  dateStarted: timestamp("date_started"),
  dateCompleted: timestamp("date_completed"),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  completionNotes: text("completion_notes"),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({ id: true });
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;

// Work Order Labor
export const workOrderLabor = pgTable("work_order_labor", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").references(() => workOrders.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  datePerformed: timestamp("date_performed").notNull(),
  notes: text("notes"),
});

export const insertWorkOrderLaborSchema = createInsertSchema(workOrderLabor).omit({ id: true });
export type InsertWorkOrderLabor = z.infer<typeof insertWorkOrderLaborSchema>;
export type WorkOrderLabor = typeof workOrderLabor.$inferSelect;

// Work Order Parts
export const workOrderParts = pgTable("work_order_parts", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").references(() => workOrders.id).notNull(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  dateIssued: timestamp("date_issued").notNull(),
});

export const insertWorkOrderPartSchema = createInsertSchema(workOrderParts).omit({ id: true });
export type InsertWorkOrderPart = z.infer<typeof insertWorkOrderPartSchema>;
export type WorkOrderPart = typeof workOrderParts.$inferSelect;

// Complete Work Order with details
export type WorkOrderWithDetails = WorkOrder & {
  asset?: Asset;
  requestedBy?: User;
  assignedTo?: User;
  type?: WorkOrderType;
  laborEntries?: WorkOrderLabor[];
  parts?: (WorkOrderPart & { inventoryItem?: InventoryItem })[];
};

// Complete Asset with details
export type AssetWithDetails = Asset & {
  type?: AssetType;
  parent?: Asset;
  workOrders?: WorkOrder[];
};

// Complete Inventory Item with details
export type InventoryItemWithDetails = InventoryItem & {
  category?: InventoryCategory;
};

// Work Requests
export const workRequests = pgTable("work_requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assetId: integer("asset_id").references(() => assets.id),
  priority: workOrderPriorityEnum("priority").notNull().default('medium'),
  status: workOrderStatusEnum("status").notNull().default('requested'),
  requestedById: integer("requested_by_id").references(() => users.id).notNull(),
  dateRequested: timestamp("date_requested").notNull().defaultNow(),
  dateNeeded: timestamp("date_needed"),
  location: text("location"),
  notes: text("notes"),
  isConverted: boolean("is_converted").notNull().default(false),
  convertedToWorkOrderId: integer("converted_to_work_order_id").references(() => workOrders.id),
});

export const insertWorkRequestSchema = createInsertSchema(workRequests).omit({ id: true });
export type InsertWorkRequest = z.infer<typeof insertWorkRequestSchema>;
export type WorkRequest = typeof workRequests.$inferSelect;

export type WorkRequestWithDetails = WorkRequest & {
  asset?: Asset;
  requestedBy?: User;
  convertedToWorkOrder?: WorkOrder;
};

// Preventive Maintenance Schedules
export const preventiveMaintenance = pgTable("preventive_maintenance", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assetId: integer("asset_id").references(() => assets.id),
  maintenanceType: maintenanceTypeEnum("maintenance_type").notNull(),
  priority: workOrderPriorityEnum("priority").notNull().default('medium'),
  startDate: timestamp("start_date").notNull(),
  duration: decimal("duration", { precision: 5, scale: 2 }).notNull(), // in hours
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  dateCreated: timestamp("date_created").notNull().defaultNow(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringPeriod: recurringPeriodEnum("recurring_period"),
  occurrences: integer("occurrences"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
});

export const insertPreventiveMaintenanceSchema = createInsertSchema(preventiveMaintenance).omit({ id: true });
export type InsertPreventiveMaintenance = z.infer<typeof insertPreventiveMaintenanceSchema>;
export type PreventiveMaintenance = typeof preventiveMaintenance.$inferSelect;

// Preventive Maintenance Technicians (many-to-many)
export const pmTechnicians = pgTable("pm_technicians", {
  id: serial("id").primaryKey(),
  pmId: integer("pm_id").references(() => preventiveMaintenance.id).notNull(),
  technicianId: integer("technician_id").references(() => users.id).notNull(),
});

export const insertPmTechnicianSchema = createInsertSchema(pmTechnicians).omit({ id: true });
export type InsertPmTechnician = z.infer<typeof insertPmTechnicianSchema>;
export type PmTechnician = typeof pmTechnicians.$inferSelect;

// PM Work Order Instances (generated from PM schedules)
export const pmWorkOrders = pgTable("pm_work_orders", {
  id: serial("id").primaryKey(),
  pmId: integer("pm_id").references(() => preventiveMaintenance.id).notNull(),
  workOrderId: integer("work_order_id").references(() => workOrders.id).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  occurrenceNumber: integer("occurrence_number"),
});

export const insertPmWorkOrderSchema = createInsertSchema(pmWorkOrders).omit({ id: true });
export type InsertPmWorkOrder = z.infer<typeof insertPmWorkOrderSchema>;
export type PmWorkOrder = typeof pmWorkOrders.$inferSelect;

export type PreventiveMaintenanceWithDetails = PreventiveMaintenance & {
  asset?: Asset;
  createdBy?: User;
  technicians?: User[];
  generatedWorkOrders?: (PmWorkOrder & { workOrder: WorkOrder })[];
};
