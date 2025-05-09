import fs from 'fs';
import path from 'path';
import { MemStorage } from './storage';
import { 
  InsertWorkOrderLabor, 
  WorkOrderLabor, 
  InsertWorkOrderPart, 
  WorkOrderPart 
} from '@shared/schema';

// Data directory and file
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE_PATH = path.join(DATA_DIR, 'storage.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class PersistentStorage extends MemStorage {
  constructor() {
    super();
    
    // Try to load data from file
    this.loadFromFile();
    
    // Set up auto-save every minute
    setInterval(() => this.saveToFile(), 60 * 1000);
  }
  
  // Override create methods to save after each operation
  async createWorkOrderLabor(labor: InsertWorkOrderLabor): Promise<WorkOrderLabor> {
    const result = await super.createWorkOrderLabor(labor);
    this.saveToFile();
    return result;
  }
  
  async createWorkOrderPart(part: InsertWorkOrderPart): Promise<WorkOrderPart> {
    const result = await super.createWorkOrderPart(part);
    this.saveToFile();
    return result;
  }
  
  // Save data to file
  private saveToFile(): void {
    try {
      // Get all data from maps
      const data = {
        users: Array.from(this.getUsersMap().values()),
        assetTypes: Array.from(this.getAssetTypesMap().values()),
        assets: Array.from(this.getAssetsMap().values()),
        inventoryCategories: Array.from(this.getInventoryCategoriesMap().values()),
        inventoryItems: Array.from(this.getInventoryItemsMap().values()),
        workOrderTypes: Array.from(this.getWorkOrderTypesMap().values()),
        workOrders: Array.from(this.getWorkOrdersMap().values()),
        workOrderLabor: Array.from(this.getWorkOrderLaborMap().values()),
        workOrderParts: Array.from(this.getWorkOrderPartsMap().values()),
        workRequests: Array.from(this.getWorkRequestsMap().values()),
        preventiveMaintenance: Array.from(this.getPreventiveMaintenanceMap().values()),
        pmTechnicians: Array.from(this.getPmTechniciansMap().values()),
        pmWorkOrders: Array.from(this.getPmWorkOrdersMap().values()),
        notifications: Array.from(this.getNotificationsMap().values()),
        documents: Array.from(this.getDocumentsMap().values()),
        currentIds: this.getCurrentIdsData()
      };
      
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
      console.log('Data successfully saved to', DATA_FILE_PATH);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
  
  // Load data from file
  private loadFromFile(): void {
    try {
      if (!fs.existsSync(DATA_FILE_PATH)) {
        console.log('No data file found, starting with fresh data');
        return;
      }
      
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (data) {
        // Load data into the storage using the parent class method
        this.loadDataFromBackup(data);
        console.log('Data successfully loaded from', DATA_FILE_PATH);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
} 