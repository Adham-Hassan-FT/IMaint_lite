import { db, schema } from './db';
import crypto from 'crypto';
import { DbStorage } from './dbStorage';

// Check if we're in Vercel or production environment
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV || process.cwd().includes('/vercel/');
const isProd = isVercel || process.env.NODE_ENV?.toLowerCase() === 'production';

console.log(`Seed Database - Environment: ${isProd ? 'Production' : 'Development'} (isVercel: ${isVercel})`);

// Hash password function
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Add days helper function
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Main seed function
export async function seedDatabase() {
  // Skip seeding in production
  if (isProd) {
    console.log('Database seeding skipped in production environment');
    return;
  }
  
  console.log('Starting database seeding...');
  const storage = new DbStorage();
  
  console.log('Checking if database already has data...');
  
  // Check if users already exist to avoid re-seeding
  const existingUsers = await db.select().from(schema.users);
  if (existingUsers.length > 0) {
    console.log('Database already has data, skipping seed process');
    return;
  }
  
  console.log('Seeding database with initial data...');

  try {
    // Create users
    console.log('Creating users...');
    const admin = await storage.createUser({
      username: "admin",
      password: hashPassword("admin123"),
      fullName: "Admin User",
      email: "admin@imaint.com",
      role: "admin",
      isActive: true
    });

    const tech = await storage.createUser({
      username: "tech",
      password: hashPassword("tech123"),
      fullName: "Technician User",
      email: "tech@imaint.com",
      role: "technician",
      isActive: true
    });
    
    const manager = await storage.createUser({
      username: "manager",
      password: hashPassword("manager123"),
      fullName: "Manager User",
      email: "manager@imaint.com",
      role: "manager",
      isActive: true
    });

    const requester = await storage.createUser({
      username: "requester",
      password: hashPassword("requester123"),
      fullName: "Requester User",
      email: "requester@imaint.com",
      role: "requester",
      isActive: true
    });

    // Create asset types
    console.log('Creating asset types...');
    const machineType = await storage.createAssetType({
      name: "Machine",
      description: "Production machinery and equipment"
    });
    
    const vehicleType = await storage.createAssetType({
      name: "Vehicle",
      description: "Company vehicles and transportation equipment"
    });
    
    const facilityType = await storage.createAssetType({
      name: "Facility",
      description: "Buildings and facilities"
    });

    // Create assets
    console.log('Creating assets...');
    const asset1 = await storage.createAsset({
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
    
    const asset2 = await storage.createAsset({
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
    
    const asset3 = await storage.createAsset({
      assetNumber: "A-003",
      description: "Main Office Building",
      typeId: facilityType.id,
      status: "operational",
      location: "123 Main Street",
      barcode: "A003-BARCODE"
    });

    // Create inventory categories
    console.log('Creating inventory categories...');
    const electricalCategory = await storage.createInventoryCategory({
      name: "Electrical",
      description: "Electrical components and supplies"
    });
    
    const mechanicalCategory = await storage.createInventoryCategory({
      name: "Mechanical",
      description: "Mechanical parts and components"
    });
    
    const consumablesCategory = await storage.createInventoryCategory({
      name: "Consumables",
      description: "Consumable supplies"
    });

    // Create inventory items
    console.log('Creating inventory items...');
    const item1 = await storage.createInventoryItem({
      partNumber: "P-001",
      name: "Electric Motor",
      description: "10HP Electric Motor",
      categoryId: electricalCategory.id,
      unitCost: "450.00",
      quantityInStock: 5,
      reorderPoint: 2,
      location: "Warehouse A - Shelf 1",
      barcode: "P001-BARCODE"
    });
    
    const item2 = await storage.createInventoryItem({
      partNumber: "P-002",
      name: "Drive Belt",
      description: "Industrial Drive Belt",
      categoryId: mechanicalCategory.id,
      unitCost: "75.00",
      quantityInStock: 12,
      reorderPoint: 5,
      location: "Warehouse A - Shelf 2",
      barcode: "P002-BARCODE"
    });
    
    const item3 = await storage.createInventoryItem({
      partNumber: "P-003",
      name: "Lubricant",
      description: "Industrial Lubricant 1L",
      categoryId: consumablesCategory.id,
      unitCost: "25.00",
      quantityInStock: 20,
      reorderPoint: 10,
      location: "Warehouse B - Shelf 3",
      barcode: "P003-BARCODE"
    });

    // Create work order types
    console.log('Creating work order types...');
    const preventiveType = await storage.createWorkOrderType({
      name: "Preventive",
      description: "Scheduled preventive maintenance"
    });
    
    const correctiveType = await storage.createWorkOrderType({
      name: "Corrective",
      description: "Repairs and corrections for failures"
    });
    
    const projectType = await storage.createWorkOrderType({
      name: "Project",
      description: "Installation or modification projects"
    });

    // Create work orders with number handling
    console.log('Creating work orders...');
    
    const workOrder1 = await storage.createWorkOrder({
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
      dateNeeded: addDays(new Date(), 7),
      dateScheduled: addDays(new Date(), 5),
      estimatedHours: "4.00",
      estimatedCost: "300.00"
    });

    // Add labor to work order with number handling
    console.log('Adding labor to work order...');
    
    await storage.createWorkOrderLabor({
      workOrderId: workOrder1.id,
      userId: tech.id,
      hours: "2.00",
      laborCost: "120.00",
      datePerformed: addDays(new Date(), -1),
      notes: "Initial inspection completed"
    });

    // Add parts to work order
    console.log('Adding parts to work order...');
    await storage.createWorkOrderPart({
      workOrderId: workOrder1.id,
      inventoryItemId: item2.id,
      quantity: 1,
      unitCost: item2.unitCost,
      totalCost: item2.unitCost,
      dateIssued: new Date()
    });
    
    // Create Work Request
    console.log('Creating work request...');
    await storage.createWorkRequest({
      requestNumber: "WR-001",
      title: "HVAC Not Working",
      description: "The HVAC system in the main office is not cooling properly",
      assetId: asset3.id,
      priority: "high",
      requestedById: requester.id,
      dateRequested: new Date(),
      dateNeeded: addDays(new Date(), 2),
      location: "Main Office - 2nd Floor",
      notes: "Temperature is reaching 85°F in the afternoon"
    });
    
    // Create Preventive Maintenance Schedule with number handling
    console.log('Creating preventive maintenance schedule...');
    
    const pm1 = await storage.createPreventiveMaintenance({
      title: "Monthly Production Line Inspection",
      description: "Regular monthly inspection of all production line components",
      assetId: asset1.id,
      maintenanceType: "inspection",
      priority: "medium",
      startDate: addDays(new Date(), 14),
      duration: "2.00",
      createdById: manager.id,
      isRecurring: true,
      recurringPeriod: "monthly",
      occurrences: 12,
      notes: "Check all belts, motors, and safety systems"
    });
    
    // Assign technicians to PM
    console.log('Assigning technicians to PM...');
    await storage.assignTechnicians(pm1.id, [tech.id]);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
} 