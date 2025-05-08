import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema, InsertUser,
  insertAssetTypeSchema, InsertAssetType,
  insertAssetSchema, InsertAsset,
  insertInventoryCategorySchema, InsertInventoryCategory,
  insertInventoryItemSchema, InsertInventoryItem,
  insertWorkOrderTypeSchema, InsertWorkOrderType,
  insertWorkOrderSchema, InsertWorkOrder,
  insertWorkOrderLaborSchema, InsertWorkOrderLabor,
  insertWorkOrderPartSchema, InsertWorkOrderPart,
  insertWorkRequestSchema, InsertWorkRequest,
  insertPreventiveMaintenanceSchema, InsertPreventiveMaintenance,
  insertNotificationSchema, InsertNotification
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import crypto from "crypto";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";

// Extend the session interface to include userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const MemoryStoreSession = MemoryStore(session);
  
  // Generate a random session secret if not provided in environment
  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
  
  // Setup session middleware
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  };

  // Hash password helper
  const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('hex');
  };

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      const hashedPassword = hashPassword(password);
      
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Return user details without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Return user details without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Users routes
  app.get('/api/users', authenticate, async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Filter out passwords
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/users/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user details without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/users', authenticate, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Hash the password
      const userData: InsertUser = {
        ...validatedData,
        password: hashPassword(validatedData.password)
      };
      
      const newUser = await storage.createUser(userData);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Asset Types routes
  app.get('/api/asset-types', async (req, res) => {
    try {
      const assetTypes = await storage.listAssetTypes();
      res.json(assetTypes);
    } catch (error) {
      console.error('List asset types error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/asset-types', authenticate, async (req, res) => {
    try {
      const validatedData = insertAssetTypeSchema.parse(req.body);
      const newAssetType = await storage.createAssetType(validatedData);
      res.status(201).json(newAssetType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create asset type error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Assets routes
  app.get('/api/assets', async (req, res) => {
    try {
      const assets = await storage.listAssets();
      res.json(assets);
    } catch (error) {
      console.error('List assets error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/assets/details', async (req, res) => {
    try {
      const assets = await storage.listAssetsWithDetails();
      res.json(assets);
    } catch (error) {
      console.error('List assets with details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/assets/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid asset ID' });
      }
      
      const asset = await storage.getAsset(id);
      
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      res.json(asset);
    } catch (error) {
      console.error('Get asset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/assets/:id/details', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid asset ID' });
      }
      
      const asset = await storage.getAssetDetails(id);
      
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      res.json(asset);
    } catch (error) {
      console.error('Get asset details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/assets', authenticate, async (req, res) => {
    try {
      // Convert date strings to Date objects before validation
      const requestData = { ...req.body };
      if (requestData.purchaseDate && typeof requestData.purchaseDate === 'string') {
        requestData.purchaseDate = new Date(requestData.purchaseDate);
      }
      if (requestData.installationDate && typeof requestData.installationDate === 'string') {
        requestData.installationDate = new Date(requestData.installationDate);
      }
      if (requestData.warrantyExpirationDate && typeof requestData.warrantyExpirationDate === 'string') {
        requestData.warrantyExpirationDate = new Date(requestData.warrantyExpirationDate);
      }
      if (requestData.lastMaintenanceDate && typeof requestData.lastMaintenanceDate === 'string') {
        requestData.lastMaintenanceDate = new Date(requestData.lastMaintenanceDate);
      }
      if (requestData.nextMaintenanceDate && typeof requestData.nextMaintenanceDate === 'string') {
        requestData.nextMaintenanceDate = new Date(requestData.nextMaintenanceDate);
      }
      
      console.log('Processing asset data:', requestData);
      const validatedData = insertAssetSchema.parse(requestData);
      const newAsset = await storage.createAsset(validatedData);
      res.status(201).json(newAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create asset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/assets/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid asset ID' });
      }
      
      // Convert date strings to Date objects before validation
      const requestData = { ...req.body };
      if (requestData.purchaseDate && typeof requestData.purchaseDate === 'string') {
        requestData.purchaseDate = new Date(requestData.purchaseDate);
      }
      if (requestData.installationDate && typeof requestData.installationDate === 'string') {
        requestData.installationDate = new Date(requestData.installationDate);
      }
      if (requestData.warrantyExpirationDate && typeof requestData.warrantyExpirationDate === 'string') {
        requestData.warrantyExpirationDate = new Date(requestData.warrantyExpirationDate);
      }
      if (requestData.lastMaintenanceDate && typeof requestData.lastMaintenanceDate === 'string') {
        requestData.lastMaintenanceDate = new Date(requestData.lastMaintenanceDate);
      }
      if (requestData.nextMaintenanceDate && typeof requestData.nextMaintenanceDate === 'string') {
        requestData.nextMaintenanceDate = new Date(requestData.nextMaintenanceDate);
      }
      
      console.log('Processing asset update data:', requestData);
      
      // Validate only the fields that are present
      const validatedData = insertAssetSchema.partial().parse(requestData);
      
      const updatedAsset = await storage.updateAsset(id, validatedData);
      
      if (!updatedAsset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      res.json(updatedAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Update asset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Inventory Categories routes
  app.get('/api/inventory-categories', async (req, res) => {
    try {
      const categories = await storage.listInventoryCategories();
      res.json(categories);
    } catch (error) {
      console.error('List inventory categories error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/inventory-categories', authenticate, async (req, res) => {
    try {
      const validatedData = insertInventoryCategorySchema.parse(req.body);
      const newCategory = await storage.createInventoryCategory(validatedData);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create inventory category error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Inventory Items routes
  app.get('/api/inventory-items', async (req, res) => {
    try {
      const items = await storage.listInventoryItems();
      res.json(items);
    } catch (error) {
      console.error('List inventory items error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/inventory-items/details', async (req, res) => {
    try {
      const items = await storage.listInventoryItemsWithDetails();
      res.json(items);
    } catch (error) {
      console.error('List inventory items with details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/inventory-items/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid inventory item ID' });
      }
      
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Get inventory item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/inventory-items/:id/details', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid inventory item ID' });
      }
      
      const item = await storage.getInventoryItemDetails(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Get inventory item details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/inventory-items', authenticate, async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const newItem = await storage.createInventoryItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create inventory item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/inventory-items/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid inventory item ID' });
      }
      
      // Validate only the fields that are present
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      
      const updatedItem = await storage.updateInventoryItem(id, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Update inventory item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Work Order Types routes
  app.get('/api/work-order-types', async (req, res) => {
    try {
      const types = await storage.listWorkOrderTypes();
      res.json(types);
    } catch (error) {
      console.error('List work order types error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/work-order-types', authenticate, async (req, res) => {
    try {
      const validatedData = insertWorkOrderTypeSchema.parse(req.body);
      const newType = await storage.createWorkOrderType(validatedData);
      res.status(201).json(newType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create work order type error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Work Orders routes
  app.get('/api/work-orders', async (req, res) => {
    try {
      const workOrders = await storage.listWorkOrders();
      res.json(workOrders);
    } catch (error) {
      console.error('List work orders error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/work-orders/details', async (req, res) => {
    try {
      const workOrders = await storage.listWorkOrdersWithDetails();
      res.json(workOrders);
    } catch (error) {
      console.error('List work orders with details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/work-orders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid work order ID' });
      }
      
      const workOrder = await storage.getWorkOrder(id);
      
      if (!workOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      res.json(workOrder);
    } catch (error) {
      console.error('Get work order error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/work-orders/:id/details', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid work order ID' });
      }
      
      const workOrder = await storage.getWorkOrderDetails(id);
      
      if (!workOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      res.json(workOrder);
    } catch (error) {
      console.error('Get work order details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/work-orders', authenticate, async (req, res) => {
    try {
      // Convert date strings to Date objects before validation
      const requestData = { ...req.body };
      if (requestData.dateRequested && typeof requestData.dateRequested === 'string') {
        requestData.dateRequested = new Date(requestData.dateRequested);
      }
      if (requestData.dateNeeded && typeof requestData.dateNeeded === 'string') {
        requestData.dateNeeded = new Date(requestData.dateNeeded);
      }
      if (requestData.dateScheduled && typeof requestData.dateScheduled === 'string') {
        requestData.dateScheduled = new Date(requestData.dateScheduled);
      }
      if (requestData.dateStarted && typeof requestData.dateStarted === 'string') {
        requestData.dateStarted = new Date(requestData.dateStarted);
      }
      if (requestData.dateCompleted && typeof requestData.dateCompleted === 'string') {
        requestData.dateCompleted = new Date(requestData.dateCompleted);
      }
      
      // Handle assignedToId=0 (which means unassigned)
      if (requestData.assignedToId === 0) {
        delete requestData.assignedToId;
      }
      
      console.log('Processing work order data:', requestData);
      const validatedData = insertWorkOrderSchema.parse(requestData);
      const newWorkOrder = await storage.createWorkOrder(validatedData);
      res.status(201).json(newWorkOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create work order error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/work-orders/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid work order ID' });
      }
      
      // Convert date strings to Date objects before validation
      const requestData = { ...req.body };
      if (requestData.dateRequested && typeof requestData.dateRequested === 'string') {
        requestData.dateRequested = new Date(requestData.dateRequested);
      }
      if (requestData.dateNeeded && typeof requestData.dateNeeded === 'string') {
        requestData.dateNeeded = new Date(requestData.dateNeeded);
      }
      if (requestData.dateScheduled && typeof requestData.dateScheduled === 'string') {
        requestData.dateScheduled = new Date(requestData.dateScheduled);
      }
      if (requestData.dateStarted && typeof requestData.dateStarted === 'string') {
        requestData.dateStarted = new Date(requestData.dateStarted);
      }
      if (requestData.dateCompleted && typeof requestData.dateCompleted === 'string') {
        requestData.dateCompleted = new Date(requestData.dateCompleted);
      }
      
      // Handle assignedToId=0 (which means unassigned)
      if (requestData.assignedToId === 0) {
        delete requestData.assignedToId;
      }
      
      console.log('Processing work order update data:', requestData);
      
      // Validate only the fields that are present
      const validatedData = insertWorkOrderSchema.partial().parse(requestData);
      
      const updatedWorkOrder = await storage.updateWorkOrder(id, validatedData);
      
      if (!updatedWorkOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      res.json(updatedWorkOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Update work order error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Work Order Labor routes
  app.get('/api/work-orders/:id/labor', authenticate, async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      if (isNaN(workOrderId)) {
        return res.status(400).json({ message: 'Invalid work order ID' });
      }
      
      const laborEntries = await storage.listWorkOrderLabor(workOrderId);
      res.json(laborEntries);
    } catch (error) {
      console.error('List work order labor error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/work-orders/:id/labor', authenticate, async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      if (isNaN(workOrderId)) {
        return res.status(400).json({ message: 'Invalid work order ID' });
      }
      
      // Make sure work order exists
      const workOrder = await storage.getWorkOrder(workOrderId);
      if (!workOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      // Include work order ID in the data
      const laborData = { ...req.body, workOrderId };
      
      // Convert datePerformed string to Date if needed
      if (laborData.datePerformed && typeof laborData.datePerformed === 'string') {
        try {
          laborData.datePerformed = new Date(laborData.datePerformed);
        } catch (e) {
          return res.status(400).json({ 
            message: 'Validation error', 
            errors: [{ path: ['datePerformed'], message: 'Invalid date format' }] 
          });
        }
      }
      
      const validatedData = insertWorkOrderLaborSchema.parse(laborData);
      const newLabor = await storage.createWorkOrderLabor(validatedData);
      
      res.status(201).json(newLabor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create work order labor error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Work Order Parts routes
  app.get('/api/work-orders/:id/parts', authenticate, async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      if (isNaN(workOrderId)) {
        return res.status(400).json({ message: 'Invalid work order ID' });
      }
      
      const parts = await storage.listWorkOrderParts(workOrderId);
      res.json(parts);
    } catch (error) {
      console.error('List work order parts error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/work-orders/:id/parts', authenticate, async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.id);
      if (isNaN(workOrderId)) {
        return res.status(400).json({ message: 'Invalid work order ID' });
      }
      
      // Make sure work order exists
      const workOrder = await storage.getWorkOrder(workOrderId);
      if (!workOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      // Make sure inventory item exists and has enough quantity
      const inventoryItemId = req.body.inventoryItemId;
      const quantity = req.body.quantity;
      
      const inventoryItem = await storage.getInventoryItem(inventoryItemId);
      if (!inventoryItem) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      if (inventoryItem.quantityInStock < quantity) {
        return res.status(400).json({ 
          message: 'Insufficient quantity in stock',
          available: inventoryItem.quantityInStock,
          requested: quantity
        });
      }
      
      // Get dateIssued from request or create new date
      let dateIssued;
      if (req.body.dateIssued && typeof req.body.dateIssued === 'string') {
        try {
          dateIssued = new Date(req.body.dateIssued);
        } catch (e) {
          return res.status(400).json({ 
            message: 'Validation error', 
            errors: [{ path: ['dateIssued'], message: 'Invalid date format' }] 
          });
        }
      } else {
        dateIssued = new Date();
      }
      
      // Include work order ID in the data
      const partData = { 
        ...req.body, 
        workOrderId,
        unitCost: inventoryItem.unitCost || 0,
        totalCost: Number(inventoryItem.unitCost || 0) * quantity,
        dateIssued: dateIssued
      };
      
      const validatedData = insertWorkOrderPartSchema.parse(partData);
      const newPart = await storage.createWorkOrderPart(validatedData);
      
      res.status(201).json(newPart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create work order part error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Barcode scanning endpoint
  app.post('/api/scan', authenticate, async (req, res) => {
    try {
      const { barcode } = req.body;
      
      if (!barcode) {
        return res.status(400).json({ message: 'Barcode is required' });
      }
      
      // Try to find an asset with this barcode
      const asset = Array.from(await storage.listAssets()).find(a => a.barcode === barcode);
      if (asset) {
        return res.json({ 
          type: 'asset',
          item: asset
        });
      }
      
      // Try to find an inventory item with this barcode
      const inventoryItem = Array.from(await storage.listInventoryItems()).find(i => i.barcode === barcode);
      if (inventoryItem) {
        return res.json({ 
          type: 'inventoryItem',
          item: inventoryItem
        });
      }
      
      // No match found
      return res.status(404).json({ message: 'No item found with this barcode' });
      
    } catch (error) {
      console.error('Barcode scan error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Work Requests routes
  app.get('/api/work-requests', async (req, res) => {
    try {
      const workRequests = await storage.listWorkRequests();
      res.json(workRequests);
    } catch (error) {
      console.error('List work requests error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/work-requests/details', async (req, res) => {
    try {
      const workRequests = await storage.listWorkRequestsWithDetails();
      res.json(workRequests);
    } catch (error) {
      console.error('List work requests with details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/work-requests/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid work request ID' });
      }
      
      const workRequest = await storage.getWorkRequest(id);
      
      if (!workRequest) {
        return res.status(404).json({ message: 'Work request not found' });
      }
      
      res.json(workRequest);
    } catch (error) {
      console.error('Get work request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/work-requests/:id/details', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid work request ID' });
      }
      
      const workRequest = await storage.getWorkRequestDetails(id);
      
      if (!workRequest) {
        return res.status(404).json({ message: 'Work request not found' });
      }
      
      res.json(workRequest);
    } catch (error) {
      console.error('Get work request details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/work-requests', authenticate, async (req, res) => {
    try {
      // Convert date strings to Date objects
      const requestData = { ...req.body };
      if (requestData.dateRequested && typeof requestData.dateRequested === 'string') {
        requestData.dateRequested = new Date(requestData.dateRequested);
      }
      if (requestData.dateNeeded && typeof requestData.dateNeeded === 'string') {
        requestData.dateNeeded = new Date(requestData.dateNeeded);
      }
      
      // Set requested by ID to current user if not specified
      if (!requestData.requestedById && req.session.userId) {
        requestData.requestedById = req.session.userId;
      }
      
      // Generate a request number if not provided
      if (!requestData.requestNumber) {
        const currentCount = (await storage.listWorkRequests()).length;
        requestData.requestNumber = `WR-${String(currentCount + 1).padStart(3, '0')}`;
      }
      
      const validatedData = insertWorkRequestSchema.parse(requestData);
      const newWorkRequest = await storage.createWorkRequest(validatedData);
      res.status(201).json(newWorkRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create work request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/work-requests/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid work request ID' });
      }
      
      // Convert date strings to Date objects
      const requestData = { ...req.body };
      if (requestData.dateRequested && typeof requestData.dateRequested === 'string') {
        requestData.dateRequested = new Date(requestData.dateRequested);
      }
      if (requestData.dateNeeded && typeof requestData.dateNeeded === 'string') {
        requestData.dateNeeded = new Date(requestData.dateNeeded);
      }
      
      const validatedData = insertWorkRequestSchema.partial().parse(requestData);
      const updatedWorkRequest = await storage.updateWorkRequest(id, validatedData);
      
      if (!updatedWorkRequest) {
        return res.status(404).json({ message: 'Work request not found' });
      }
      
      res.json(updatedWorkRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Update work request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/work-requests/:id/convert', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid work request ID' });
      }
      
      // Any additional work order data
      const workOrderData = req.body;
      
      const workOrder = await storage.convertWorkRequestToWorkOrder(id, workOrderData);
      
      if (!workOrder) {
        return res.status(404).json({ message: 'Work request not found or conversion failed' });
      }
      
      res.status(201).json(workOrder);
    } catch (error) {
      console.error('Convert work request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Preventive Maintenance routes
  app.get('/api/preventive-maintenance', async (req, res) => {
    try {
      const pmSchedules = await storage.listPreventiveMaintenances();
      res.json(pmSchedules);
    } catch (error) {
      console.error('List preventive maintenance error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/preventive-maintenance/details', async (req, res) => {
    try {
      const pmSchedules = await storage.listPreventiveMaintenancesWithDetails();
      res.json(pmSchedules);
    } catch (error) {
      console.error('List preventive maintenance with details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/preventive-maintenance/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid preventive maintenance ID' });
      }
      
      const pmSchedule = await storage.getPreventiveMaintenance(id);
      
      if (!pmSchedule) {
        return res.status(404).json({ message: 'Preventive maintenance schedule not found' });
      }
      
      res.json(pmSchedule);
    } catch (error) {
      console.error('Get preventive maintenance error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/preventive-maintenance/:id/details', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid preventive maintenance ID' });
      }
      
      const pmSchedule = await storage.getPreventiveMaintenanceDetails(id);
      
      if (!pmSchedule) {
        return res.status(404).json({ message: 'Preventive maintenance schedule not found' });
      }
      
      res.json(pmSchedule);
    } catch (error) {
      console.error('Get preventive maintenance details error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/preventive-maintenance', authenticate, async (req, res) => {
    try {
      // Convert date strings to Date objects
      const requestData = { ...req.body };
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        requestData.startDate = new Date(requestData.startDate);
      }
      if (requestData.dateCreated && typeof requestData.dateCreated === 'string') {
        requestData.dateCreated = new Date(requestData.dateCreated);
      }
      // Convert duration number to string for Zod decimal parsing
      if (requestData.duration && typeof requestData.duration === 'number') {
        requestData.duration = requestData.duration.toString();
      }
      
      // Set created by ID to current user if not specified
      if (!requestData.createdById && req.session.userId) {
        requestData.createdById = req.session.userId;
      }
      
      const validatedData = insertPreventiveMaintenanceSchema.parse(requestData);
      const newPM = await storage.createPreventiveMaintenance(validatedData);
      
      // If technicians are specified, assign them
      if (requestData.technicians && Array.isArray(requestData.technicians)) {
        await storage.assignTechnicians(newPM.id, requestData.technicians);
      }
      
      // Generate work orders if required immediately
      if (requestData.generateWorkOrdersImmediately) {
        await storage.generateWorkOrdersFromPM(newPM.id);
      }
      
      res.status(201).json(newPM);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create preventive maintenance error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/preventive-maintenance/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid preventive maintenance ID' });
      }
      
      // Convert date strings to Date objects
      const requestData = { ...req.body };
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        requestData.startDate = new Date(requestData.startDate);
      }
      // Convert duration number to string for Zod decimal parsing
      if (requestData.duration && typeof requestData.duration === 'number') {
        requestData.duration = requestData.duration.toString();
      }
      
      const validatedData = insertPreventiveMaintenanceSchema.partial().parse(requestData);
      const updatedPM = await storage.updatePreventiveMaintenance(id, validatedData);
      
      if (!updatedPM) {
        return res.status(404).json({ message: 'Preventive maintenance schedule not found' });
      }
      
      // If technicians are specified, update assignments
      if (requestData.technicians && Array.isArray(requestData.technicians)) {
        await storage.assignTechnicians(id, requestData.technicians);
      }
      
      res.json(updatedPM);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Update preventive maintenance error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/preventive-maintenance/:id/technicians', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid preventive maintenance ID' });
      }
      
      const { technicianIds } = req.body;
      
      if (!Array.isArray(technicianIds)) {
        return res.status(400).json({ message: 'Technician IDs must be an array' });
      }
      
      const result = await storage.assignTechnicians(id, technicianIds);
      res.json(result);
    } catch (error) {
      console.error('Assign technicians error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/preventive-maintenance/:pmId/technicians/:techId', authenticate, async (req, res) => {
    try {
      const pmId = parseInt(req.params.pmId);
      const techId = parseInt(req.params.techId);
      
      if (isNaN(pmId) || isNaN(techId)) {
        return res.status(400).json({ message: 'Invalid ID parameters' });
      }
      
      const result = await storage.removeTechnician(pmId, techId);
      
      if (!result) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Remove technician error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/preventive-maintenance/:id/generate-work-orders', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid preventive maintenance ID' });
      }
      
      const workOrders = await storage.generateWorkOrdersFromPM(id);
      
      res.status(201).json(workOrders);
    } catch (error) {
      console.error('Generate work orders error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  app.get('/api/preventive-maintenance/:id/work-orders', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid preventive maintenance ID' });
      }
      
      const workOrders = await storage.getWorkOrdersForPM(id);
      
      res.json(workOrders);
    } catch (error) {
      console.error('Get work orders for PM error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Notifications routes
  app.get('/api/notifications', authenticate, async (req, res) => {
    try {
      // User ID comes from the authenticated session
      const userId = req.session.userId as number;
      const notifications = await storage.listNotificationsForUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error('List notifications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/notifications/count', authenticate, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const count = await storage.countUnreadNotifications(userId);
      res.json({ count });
    } catch (error) {
      console.error('Count notifications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/notifications/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Ensure the user can only access their own notifications
      if (notification.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(notification);
    } catch (error) {
      console.error('Get notification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications', authenticate, async (req, res) => {
    try {
      // Only allow admin and manager roles to create notifications for other users
      const currentUser = await storage.getUser(req.session.userId as number);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager' && req.body.userId !== req.session.userId)) {
        return res.status(403).json({ message: 'Not authorized to create notifications for other users' });
      }
      
      const validatedData = insertNotificationSchema.parse(req.body);
      const newNotification = await storage.createNotification(validatedData);
      res.status(201).json(newNotification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create notification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Ensure the user can only modify their own notifications
      if (notification.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(id);
      res.json(updatedNotification);
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/notifications/:id/dismiss', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Ensure the user can only modify their own notifications
      if (notification.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedNotification = await storage.markNotificationAsDismissed(id);
      res.json(updatedNotification);
    } catch (error) {
      console.error('Mark notification as dismissed error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/notifications/read-all', authenticate, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/notifications/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Ensure the user can only delete their own notifications (except admins)
      const currentUser = await storage.getUser(req.session.userId as number);
      if (!currentUser || (currentUser.role !== 'admin' && notification.userId !== req.session.userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const success = await storage.deleteNotification(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete notification' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Document Management routes - Fixed implementation
  // Create uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Configure multer storage
  const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const { entityType, entityId } = req.params;
        const dir = path.join(uploadsDir, entityType, entityId);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      } catch (error) {
        cb(error as Error, '');
      }
    }
  });
  
  const fileUpload = multer({ storage: fileStorage });
  
  // Get documents for an entity
  app.get('/api/documents/:entityType/:entityId', async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const docs = await storage.getDocuments(entityType, parseInt(entityId));
      res.json(docs);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ message: 'Error retrieving documents' });
    }
  });
  
  // Upload document with multer
  app.post('/api/documents/:entityType/:entityId/upload', (req, res) => {
    // Use multer middleware for this specific route
    fileUpload.single('file')(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(500).json({ message: 'File upload failed', error: err.message });
      }
      
      try {
        // Get the file from the request (added by multer)
        const file = req.file;
        if (!file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const { entityType, entityId } = req.params;
        
        // Create document record in database
        const document = {
          filename: file.originalname,
          filesize: file.size,
          contentType: file.mimetype,
          entityType,
          entityId: parseInt(entityId),
          filePath: file.path,
          uploadDate: new Date()
        };
        
        // Save document metadata to database
        const savedDocument = await storage.createDocument(document);
        
        res.status(201).json({
          id: savedDocument.id,
          filename: savedDocument.filename,
          filesize: savedDocument.filesize,
          contentType: savedDocument.contentType,
          entityType: savedDocument.entityType,
          entityId: savedDocument.entityId,
          uploadDate: savedDocument.uploadDate
        });
      } catch (error) {
        console.error('Document creation error:', error);
        res.status(500).json({ message: 'Error saving document metadata' });
      }
    });
  });
  
  // Download document
  app.get('/api/documents/:id/download', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const doc = await storage.getDocument(id);
      
      if (!doc || !doc.filePath) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Check if file exists
      if (!fs.existsSync(doc.filePath)) {
        return res.status(404).json({ message: 'Document file not found' });
      }
      
      // Send file
      res.download(doc.filePath, doc.filename);
    } catch (error) {
      console.error('Download document error:', error);
      res.status(500).json({ message: 'Error retrieving document' });
    }
  });
  
  // Delete document
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get document before deletion to get the file path
      const doc = await storage.getDocument(id);
      
      if (!doc) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Delete document record from database
      await storage.deleteDocument(id);
      
      // Delete file if exists and has a path
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }
      
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
