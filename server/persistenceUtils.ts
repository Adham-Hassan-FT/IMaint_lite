import fs from 'fs';
import path from 'path';

// Define the data directory path
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE_PATH = path.join(DATA_DIR, 'storage.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interface for storage data
export interface StorageData {
  users: any[];
  assetTypes: any[];
  assets: any[];
  inventoryCategories: any[];
  inventoryItems: any[];
  workOrderTypes: any[];
  workOrders: any[];
  workOrderLabor: any[];
  workOrderParts: any[];
  workRequests: any[];
  preventiveMaintenance: any[];
  pmTechnicians: any[];
  pmWorkOrders: any[];
  notifications: any[];
  documents: any[];
  currentIds: {
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
    documents: number;
  }
}

// Save data to file
export function saveData(data: StorageData): void {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    console.log('Data successfully saved to', DATA_FILE_PATH);
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load data from file
export function loadData(): StorageData | null {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.log('No data file found at', DATA_FILE_PATH);
      return null;
    }
    
    const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(fileContent) as StorageData;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
} 