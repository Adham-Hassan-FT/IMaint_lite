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
  insertWorkOrderPartSchema, InsertWorkOrderPart
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  const MemoryStoreSession = MemoryStore(session);
  
  // Setup session middleware
  app.use(session({
    secret: 'iMaintSecret',
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
      const validatedData = insertAssetSchema.parse(req.body);
      const newAsset = await storage.createAsset(validatedData);
      res.status(201).json(newAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      
      // Validate only the fields that are present
      const validatedData = insertAssetSchema.partial().parse(req.body);
      
      const updatedAsset = await storage.updateAsset(id, validatedData);
      
      if (!updatedAsset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      res.json(updatedAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const newWorkOrder = await storage.createWorkOrder(validatedData);
      res.status(201).json(newWorkOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      
      // Validate only the fields that are present
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      
      const updatedWorkOrder = await storage.updateWorkOrder(id, validatedData);
      
      if (!updatedWorkOrder) {
        return res.status(404).json({ message: 'Work order not found' });
      }
      
      res.json(updatedWorkOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      
      // Include work order ID in the data
      const partData = { 
        ...req.body, 
        workOrderId,
        unitCost: inventoryItem.unitCost,
        totalCost: inventoryItem.unitCost * quantity,
        dateIssued: new Date()
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

  const httpServer = createServer(app);
  return httpServer;
}
