import { db, schema } from './db';
import { IStorage, Document, InsertDocument } from './storage';
import { eq, and, desc, sql } from 'drizzle-orm';
import { type SQL } from 'drizzle-orm/sql';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { QueryResult } from 'pg';

// Define database document format for mapping rows from raw SQL queries
interface DbDocument {
  id: number;
  filename: string;
  filesize: number;
  content_type: string;
  entity_type: string;
  entity_id: number;
  file_path: string;
  upload_date: string;
}

// Implementation of the IStorage interface using PostgreSQL database
export class DbStorage implements IStorage {
  // Users
  async getUser(id: number) {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    // Drizzle returns an array for select queries
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string) {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async listUsers() {
    return await db.select().from(schema.users);
  }

  async createUser(user: schema.InsertUser) {
    const result = await db.insert(schema.users).values(user).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  async updateUser(id: number, userData: Partial<schema.InsertUser>) {
    const result = await db
      .update(schema.users)
      .set(userData)
      .where(eq(schema.users.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Asset Types
  async getAssetType(id: number) {
    const result = await db.select().from(schema.assetTypes).where(eq(schema.assetTypes.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async listAssetTypes() {
    return await db.select().from(schema.assetTypes);
  }

  async createAssetType(assetType: schema.InsertAssetType) {
    const result = await db.insert(schema.assetTypes).values(assetType).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  // Assets
  async getAsset(id: number) {
    const result = await db.select().from(schema.assets).where(eq(schema.assets.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getAssetByNumber(assetNumber: string) {
    const result = await db.select().from(schema.assets).where(eq(schema.assets.assetNumber, assetNumber)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getAssetDetails(id: number) {
    const asset = await this.getAsset(id);
    if (!asset) return undefined;

    const assetType = asset.typeId ? await this.getAssetType(asset.typeId) : undefined;
    const parentAsset = asset.parentId ? await this.getAsset(asset.parentId) : undefined;
    
    const workOrders = await db.select().from(schema.workOrders).where(eq(schema.workOrders.assetId, id));

    return {
      ...asset,
      type: assetType,
      parent: parentAsset,
      workOrders
    };
  }

  async listAssets() {
    return await db.select().from(schema.assets);
  }

  async listAssetsWithDetails(): Promise<schema.AssetWithDetails[]> {
    const assets = await this.listAssets();
    const detailsPromises = assets.map(asset => this.getAssetDetails(asset.id));
    const details = await Promise.all(detailsPromises);
    return details.filter((asset): asset is schema.AssetWithDetails => asset !== undefined);
  }

  async createAsset(asset: schema.InsertAsset) {
    const result = await db.insert(schema.assets).values(asset).returning();
    // Fix type handling for query result
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  async updateAsset(id: number, assetData: Partial<schema.InsertAsset>) {
    const result = await db
      .update(schema.assets)
      .set(assetData)
      .where(eq(schema.assets.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Inventory Categories
  async getInventoryCategory(id: number) {
    const result = await db.select().from(schema.inventoryCategories).where(eq(schema.inventoryCategories.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async listInventoryCategories() {
    return await db.select().from(schema.inventoryCategories);
  }

  async createInventoryCategory(category: schema.InsertInventoryCategory) {
    const result = await db.insert(schema.inventoryCategories).values(category).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  // Inventory Items
  async getInventoryItem(id: number) {
    const result = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getInventoryItemByPartNumber(partNumber: string) {
    const result = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.partNumber, partNumber)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getInventoryItemDetails(id: number): Promise<schema.InventoryItemWithDetails | undefined> {
    const item = await this.getInventoryItem(id);
    if (!item) return undefined;

    const category = item.categoryId ? await this.getInventoryCategory(item.categoryId) : undefined;
    
    return {
      ...item,
      category
    };
  }

  async listInventoryItems() {
    return await db.select().from(schema.inventoryItems);
  }

  async listInventoryItemsWithDetails(): Promise<schema.InventoryItemWithDetails[]> {
    const items = await this.listInventoryItems();
    const detailsPromises = items.map(async item => {
      const details = await this.getInventoryItemDetails(item.id);
      return details;
    });
    
    const details = await Promise.all(detailsPromises);
    const validDetails: schema.InventoryItemWithDetails[] = [];
    
    for (const detail of details) {
      if (detail !== undefined) {
        validDetails.push(detail);
      }
    }
    
    return validDetails;
  }

  async createInventoryItem(item: schema.InsertInventoryItem) {
    // Make sure unitCost is properly formatted
    const formattedItem = { ...item };
    
    // Convert empty string unitCost to null or a valid decimal
    if (formattedItem.unitCost === "") {
      formattedItem.unitCost = "0.00";
    }
    
    try {
      const result = await db.insert(schema.inventoryItems).values(formattedItem).returning();
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return null as any;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(id: number, itemData: Partial<schema.InsertInventoryItem>) {
    // Make sure unitCost is properly formatted
    const formattedItemData = { ...itemData };
    
    // Convert empty string unitCost to null or a valid decimal
    if (formattedItemData.unitCost === "") {
      formattedItemData.unitCost = "0.00";
    }
    
    try {
      const result = await db
        .update(schema.inventoryItems)
        .set(formattedItemData)
        .where(eq(schema.inventoryItems.id, id))
        .returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  // Work Order Types
  async getWorkOrderType(id: number) {
    const result = await db.select().from(schema.workOrderTypes).where(eq(schema.workOrderTypes.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async listWorkOrderTypes() {
    return await db.select().from(schema.workOrderTypes);
  }

  async createWorkOrderType(type: schema.InsertWorkOrderType) {
    const result = await db.insert(schema.workOrderTypes).values(type).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  // Work Orders
  async getWorkOrder(id: number) {
    const result = await db.select().from(schema.workOrders).where(eq(schema.workOrders.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getWorkOrderByNumber(number: string) {
    const result = await db.select().from(schema.workOrders).where(eq(schema.workOrders.workOrderNumber, number)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getWorkOrderDetails(id: number) {
    const workOrder = await this.getWorkOrder(id);
    if (!workOrder) return undefined;

    console.log(`WorkOrder ${id} has assetId:`, workOrder.assetId);
    
    let asset = undefined;
    if (workOrder.assetId) {
      asset = await this.getAsset(workOrder.assetId);
      console.log(`Retrieved asset for WorkOrder ${id}:`, asset);
      
      // If asset still not found but assetId exists, it might be a data inconsistency
      if (!asset) {
        console.warn(`Asset with ID ${workOrder.assetId} not found but referenced in work order ${id}`);
      }
    }
    
    const requestedBy = workOrder.requestedById ? await this.getUser(workOrder.requestedById) : undefined;
    const assignedTo = workOrder.assignedToId ? await this.getUser(workOrder.assignedToId) : undefined;
    const type = workOrder.typeId ? await this.getWorkOrderType(workOrder.typeId) : undefined;
    
    const laborEntries = await db.select().from(schema.workOrderLabor).where(eq(schema.workOrderLabor.workOrderId, id));
    
    const parts = await Promise.all(
      (await db.select().from(schema.workOrderParts).where(eq(schema.workOrderParts.workOrderId, id)))
        .map(async part => {
          const inventoryItem = part.inventoryItemId ? 
            await this.getInventoryItem(part.inventoryItemId) : 
            undefined;
          return { ...part, inventoryItem };
        })
    );

    const workOrderDetails: schema.WorkOrderWithDetails = {
      ...workOrder,
      asset,
      requestedBy,
      assignedTo,
      type,
      laborEntries,
      parts
    };
    
    console.log(`Final work order details for ${id}:`, JSON.stringify({
      id: workOrderDetails.id,
      assetId: workOrderDetails.assetId,
      asset: workOrderDetails.asset
    }));
    
    return workOrderDetails;
  }

  async listWorkOrders() {
    return await db.select().from(schema.workOrders);
  }

  async listWorkOrdersWithDetails(): Promise<schema.WorkOrderWithDetails[]> {
    const workOrders = await this.listWorkOrders();
    const detailsPromises = workOrders.map(async wo => {
      const details = await this.getWorkOrderDetails(wo.id);
      return details;
    });
    
    const details = await Promise.all(detailsPromises);
    const validDetails: schema.WorkOrderWithDetails[] = [];
    
    for (const detail of details) {
      if (detail !== undefined) {
        validDetails.push(detail);
      }
    }
    
    return validDetails;
  }

  async createWorkOrder(workOrder: schema.InsertWorkOrder) {
    const result = await db.insert(schema.workOrders).values(workOrder).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  async updateWorkOrder(id: number, workOrderData: Partial<schema.InsertWorkOrder>) {
    const result = await db
      .update(schema.workOrders)
      .set(workOrderData)
      .where(eq(schema.workOrders.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Work Order Labor
  async createWorkOrderLabor(labor: schema.InsertWorkOrderLabor) {
    const result = await db.insert(schema.workOrderLabor).values(labor).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  async listWorkOrderLabor(workOrderId: number) {
    return await db.select().from(schema.workOrderLabor).where(eq(schema.workOrderLabor.workOrderId, workOrderId));
  }

  // Work Order Parts
  async createWorkOrderPart(part: schema.InsertWorkOrderPart) {
    const result = await db.insert(schema.workOrderParts).values(part).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  async listWorkOrderParts(workOrderId: number) {
    return await db.select().from(schema.workOrderParts).where(eq(schema.workOrderParts.workOrderId, workOrderId));
  }

  // Work Requests
  async getWorkRequest(id: number) {
    const result = await db.select().from(schema.workRequests).where(eq(schema.workRequests.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getWorkRequestByNumber(number: string) {
    const result = await db.select().from(schema.workRequests).where(eq(schema.workRequests.requestNumber, number)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getWorkRequestDetails(id: number): Promise<schema.WorkRequestWithDetails | undefined> {
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

  async listWorkRequests() {
    return await db.select().from(schema.workRequests);
  }

  async listWorkRequestsWithDetails(): Promise<schema.WorkRequestWithDetails[]> {
    const workRequests = await this.listWorkRequests();
    const detailsPromises = workRequests.map(async wr => {
      const details = await this.getWorkRequestDetails(wr.id);
      return details;
    });
    
    const details = await Promise.all(detailsPromises);
    const validDetails: schema.WorkRequestWithDetails[] = [];
    
    for (const detail of details) {
      if (detail !== undefined) {
        validDetails.push(detail);
      }
    }
    
    return validDetails;
  }

  async createWorkRequest(workRequest: schema.InsertWorkRequest) {
    const result = await db.insert(schema.workRequests).values(workRequest).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  async updateWorkRequest(id: number, workRequestData: Partial<schema.InsertWorkRequest>) {
    const result = await db
      .update(schema.workRequests)
      .set(workRequestData)
      .where(eq(schema.workRequests.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async convertWorkRequestToWorkOrder(id: number, workOrderData?: Partial<schema.InsertWorkOrder>) {
    const workRequest = await this.getWorkRequest(id);
    if (!workRequest) return undefined;
    
    // Generate a work order number
    const woCount = (await this.listWorkOrders()).length;
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

  // Preventive Maintenance
  async getPreventiveMaintenance(id: number) {
    const result = await db.select().from(schema.preventiveMaintenance).where(eq(schema.preventiveMaintenance.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getPreventiveMaintenanceDetails(id: number): Promise<schema.PreventiveMaintenanceWithDetails | undefined> {
    const pm = await this.getPreventiveMaintenance(id);
    if (!pm) return undefined;

    const asset = pm.assetId ? await this.getAsset(pm.assetId) : undefined;
    const createdBy = pm.createdById ? await this.getUser(pm.createdById) : undefined;
    
    // Get technicians assigned to this PM
    const technicianAssignments = await db.select()
      .from(schema.pmTechnicians)
      .where(eq(schema.pmTechnicians.pmId, id));
    
    const technicians = await Promise.all(
      technicianAssignments.map(async assignment => {
        const user = await this.getUser(assignment.technicianId);
        return user;
      })
    );
    
    // Filter out any undefined technicians
    const validTechnicians = technicians.filter((tech): tech is schema.User => tech !== undefined);
    
    // Get work orders generated from this PM
    const pmWorkOrdersList = await db.select()
      .from(schema.pmWorkOrders)
      .where(eq(schema.pmWorkOrders.pmId, id));
    
    const generatedWorkOrders = await Promise.all(
      pmWorkOrdersList.map(async pmwo => {
        const workOrder = await this.getWorkOrder(pmwo.workOrderId);
        if (!workOrder) return undefined;
        return { ...pmwo, workOrder };
      })
    );
    
    // Filter out any undefined work orders
    const validWorkOrders = generatedWorkOrders.filter((wo): wo is (schema.PmWorkOrder & { workOrder: schema.WorkOrder }) => 
      wo !== undefined
    );

    return {
      ...pm,
      asset,
      createdBy,
      technicians: validTechnicians,
      generatedWorkOrders: validWorkOrders
    };
  }

  async listPreventiveMaintenances() {
    return await db.select().from(schema.preventiveMaintenance);
  }

  async listPreventiveMaintenancesWithDetails(): Promise<schema.PreventiveMaintenanceWithDetails[]> {
    const pmSchedules = await this.listPreventiveMaintenances();
    const detailsPromises = pmSchedules.map(pm => this.getPreventiveMaintenanceDetails(pm.id));
    const details = await Promise.all(detailsPromises);
    
    // Filter out undefined values
    const validDetails: schema.PreventiveMaintenanceWithDetails[] = [];
    for (const detail of details) {
      if (detail !== undefined) {
        validDetails.push(detail);
      }
    }
    
    return validDetails;
  }

  async createPreventiveMaintenance(pm: schema.InsertPreventiveMaintenance) {
    const result = await db.insert(schema.preventiveMaintenance).values(pm).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  async updatePreventiveMaintenance(id: number, pmData: Partial<schema.InsertPreventiveMaintenance>) {
    const result = await db
      .update(schema.preventiveMaintenance)
      .set(pmData)
      .where(eq(schema.preventiveMaintenance.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // PM Technicians
  async assignTechnicians(pmId: number, technicianIds: number[]): Promise<schema.PmTechnician[]> {
    // First remove any existing technicians
    await db
      .delete(schema.pmTechnicians)
      .where(eq(schema.pmTechnicians.pmId, pmId));
    
    // Now add the new technicians
    const technicians: schema.PmTechnician[] = [];
    
    for (const techId of technicianIds) {
      const insertedTech = await db
        .insert(schema.pmTechnicians)
        .values({ pmId, technicianId: techId })
        .returning();
      
      if (insertedTech.length > 0) {
        technicians.push(insertedTech[0]);
      }
    }
    
    return technicians;
  }

  async removeTechnician(pmId: number, technicianId: number): Promise<boolean> {
    await db
      .delete(schema.pmTechnicians)
      .where(
        and(
          eq(schema.pmTechnicians.pmId, pmId),
          eq(schema.pmTechnicians.technicianId, technicianId)
        )
      );
    
    return true;
  }

  async listTechniciansForPM(pmId: number): Promise<schema.User[]> {
    const assignments = await db
      .select()
      .from(schema.pmTechnicians)
      .where(eq(schema.pmTechnicians.pmId, pmId));
    
    const technicians = await Promise.all(
      assignments.map(async assignment => {
        return await this.getUser(assignment.technicianId);
      })
    );
    
    return technicians.filter((tech): tech is schema.User => tech !== undefined);
  }

  // PM Work Orders
  async generateWorkOrdersFromPM(pmId: number): Promise<schema.PmWorkOrder[]> {
    const pm = await this.getPreventiveMaintenance(pmId);
    if (!pm) throw new Error(`Preventive maintenance schedule with ID ${pmId} not found`);
    
    // Get technicians assigned to this PM
    const technicians = await this.listTechniciansForPM(pmId);
    
    const workOrders: schema.PmWorkOrder[] = [];
    
    // For one-time maintenance
    if (!pm.isRecurring) {
      // Generate work order number
      const woCount = (await this.listWorkOrders()).length;
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
      const pmWorkOrder = await db
        .insert(schema.pmWorkOrders)
        .values({
          pmId,
          workOrderId: workOrder.id,
          scheduledDate: pm.startDate,
          occurrenceNumber: 1
        })
        .returning();
      
      if (pmWorkOrder.length > 0) {
        workOrders.push(pmWorkOrder[0]);
      }
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
        const woCount = (await this.listWorkOrders()).length;
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
        const pmWorkOrder = await db
          .insert(schema.pmWorkOrders)
          .values({
            pmId,
            workOrderId: workOrder.id,
            scheduledDate: scheduledDate,
            occurrenceNumber: i + 1
          })
          .returning();
        
        if (pmWorkOrder.length > 0) {
          workOrders.push(pmWorkOrder[0]);
        }
      }
    }
    
    return workOrders;
  }

  async getWorkOrdersForPM(pmId: number): Promise<(schema.PmWorkOrder & { workOrder: schema.WorkOrder })[]> {
    const pmWorkOrders = await db
      .select()
      .from(schema.pmWorkOrders)
      .where(eq(schema.pmWorkOrders.pmId, pmId));
    
    const result = await Promise.all(
      pmWorkOrders.map(async pmwo => {
        const workOrder = await this.getWorkOrder(pmwo.workOrderId);
        if (!workOrder) return undefined;
        return { ...pmwo, workOrder };
      })
    );
    
    // Filter out undefined values
    const validResults: (schema.PmWorkOrder & { workOrder: schema.WorkOrder })[] = [];
    for (const item of result) {
      if (item !== undefined) {
        validResults.push(item as schema.PmWorkOrder & { workOrder: schema.WorkOrder });
      }
    }
    
    return validResults;
  }

  // Notifications
  async getNotification(id: number) {
    const result = await db.select().from(schema.notifications).where(eq(schema.notifications.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async listNotificationsForUser(userId: number) {
    return await db.select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async createNotification(notification: schema.InsertNotification) {
    const result = await db.insert(schema.notifications).values(notification).returning();
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null as any;
  }

  async markNotificationAsRead(id: number) {
    const notification = await this.getNotification(id);
    if (!notification) return undefined;

    const result = await db
      .update(schema.notifications)
      .set({
        status: 'read',
        readAt: new Date()
      })
      .where(eq(schema.notifications.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async markNotificationAsDismissed(id: number) {
    const notification = await this.getNotification(id);
    if (!notification) return undefined;

    const result = await db
      .update(schema.notifications)
      .set({
        status: 'dismissed',
        dismissedAt: new Date()
      })
      .where(eq(schema.notifications.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async markAllNotificationsAsRead(userId: number) {
    await db
      .update(schema.notifications)
      .set({
        status: 'read',
        readAt: new Date()
      })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.status, 'unread')
        )
      );
  }

  async countUnreadNotifications(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.status, 'unread')
        )
      );
    
    return result.length > 0 ? Number(result[0].count) : 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    await db
      .delete(schema.notifications)
      .where(eq(schema.notifications.id, id));
    
    return true;
  }

  // Documents - We'll implement a file-based approach since there's no schema table
  // Create documents table in the database
  private documentsTableName = 'documents';
  private documentsDir = path.join(process.cwd(), 'uploads');
  private documentIdCounter = 1;
  
  // Make sure uploads directory exists
  private ensureUploadsDirectory() {
    if (!fs.existsSync(this.documentsDir)) {
      fs.mkdirSync(this.documentsDir, { recursive: true });
    }
  }
  
  private async getNextDocumentId(): Promise<number> {
    try {
      // Try to get the highest ID from existing documents
      const queryResult = await db.execute(
        sql`SELECT MAX(id) as max_id FROM documents`
      );
      
      if (queryResult.rows.length > 0 && queryResult.rows[0].max_id) {
        return Number(queryResult.rows[0].max_id) + 1;
      }
      
      return 1; // Start with 1 if no documents exist
    } catch (error) {
      console.error('Error getting next document ID:', error);
      // If table doesn't exist yet, start with 1
      return this.documentIdCounter++;
    }
  }
  
  private async ensureDocumentsTable() {
    try {
      // Check if table exists
      const tableExists = await db.execute(
        sql`SELECT to_regclass('documents') IS NOT NULL as exists`
      );
      
      if (tableExists.rows.length === 0 || !tableExists.rows[0].exists) {
        // Create the documents table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            filesize INTEGER NOT NULL,
            content_type TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            upload_date TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
      }
    } catch (error) {
      console.error('Error ensuring documents table exists:', error);
    }
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    await this.ensureDocumentsTable();
    
    try {
      // Define the result type for the SQL query
      type DbDocResult = {
        id: number;
        filename: string;
        filesize: number;
        content_type: string;
        entity_type: string;
        entity_id: number;
        file_path: string;
        upload_date: string;
      };
      
      // Use explicit typing for the query result
      const result = await db.execute<DbDocResult>(
        sql`SELECT id, filename, filesize, content_type, entity_type, entity_id, file_path, upload_date FROM documents WHERE id = ${id} LIMIT 1`
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const doc = result.rows[0];
      
      // Convert from snake_case database columns to camelCase Document interface
      return {
        id: doc.id,
        filename: doc.filename,
        filesize: doc.filesize,
        contentType: doc.content_type,
        entityType: doc.entity_type,
        entityId: doc.entity_id,
        filePath: doc.file_path,
        uploadDate: new Date(doc.upload_date)
      };
    } catch (error) {
      console.error('Error retrieving document:', error);
      return undefined;
    }
  }

  async getDocuments(entityType: string, entityId: number): Promise<Document[]> {
    await this.ensureDocumentsTable();
    
    try {
      // Define the result type for the SQL query
      type DbDocResult = {
        id: number;
        filename: string;
        filesize: number;
        content_type: string;
        entity_type: string;
        entity_id: number;
        file_path: string;
        upload_date: string;
      };
      
      // Use explicit typing for the query result
      const result = await db.execute<DbDocResult>(
        sql`SELECT id, filename, filesize, content_type, entity_type, entity_id, file_path, upload_date FROM documents WHERE entity_type = ${entityType} AND entity_id = ${entityId} ORDER BY upload_date DESC`
      );
      
      // Map DB rows to Document interface
      return result.rows.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        filesize: doc.filesize,
        contentType: doc.content_type,
        entityType: doc.entity_type,
        entityId: doc.entity_id,
        filePath: doc.file_path,
        uploadDate: new Date(doc.upload_date)
      }));
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    await this.ensureDocumentsTable();
    this.ensureUploadsDirectory();
    
    const id = await this.getNextDocumentId();
    
    try {
      // Insert document into database, using specific column names
      await db.execute(
        sql`INSERT INTO documents (
          id, filename, filesize, content_type, entity_type, entity_id, file_path, upload_date
        ) VALUES (
          ${id}, ${document.filename}, ${document.filesize}, ${document.contentType}, 
          ${document.entityType}, ${document.entityId}, ${document.filePath}, ${document.uploadDate}
        )`
      );
      
      // Return the document with its new ID
      return {
        id,
        ...document
      };
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document in database');
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    await this.ensureDocumentsTable();
    
    // Get document to find file path
    const document = await this.getDocument(id);
    
    if (document) {
      // Delete the physical file if it exists
      try {
        if (fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath);
        }
      } catch (error) {
        console.error(`Error deleting file for document ${id}:`, error);
      }
      
      try {
        // Delete from database
        await db.execute(
          sql`DELETE FROM documents WHERE id = ${id}`
        );
        return true;
      } catch (error) {
        console.error('Error deleting document from database:', error);
        return false;
      }
    }
    
    return true;
  }
} 