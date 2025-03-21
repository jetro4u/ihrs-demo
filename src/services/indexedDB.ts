import { DataRecordPayload, DataValuePayload, StoredDataRecord, StoredDataValue } from '../app/(private)/apps/ihrs/types'
import { submitToServer } from '../app/(private)/apps/ihrs/utils/apiService';

// Define the store names as a const object
const DB_NAME = 'dataorb-db';
const DB_VERSION = 1;
const STORES = {
  DATA_VALUES: 'dataValuesStore',
  DATA_RECORDS: 'dataRecordsStore',
  FAILED_DATA_VALUES: 'failedDataValuesStore',
  FAILED_DATA_RECORDS: 'failedDataRecordsStore'
} as const;

// Initialize the database


// Initialize the database
// Modify the initDB function to ensure it's only initialized once
let dbInstance = null;

export const initDB = (): Promise<IDBDatabase> => {
  // If we already have a connection, use it
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event: Event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject('IndexedDB error: ' + (event.target as IDBOpenDBRequest).error);
    };
    
    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB initialized successfully');
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      
      // Check if stores exist before creating them
      if (!db.objectStoreNames.contains(STORES.DATA_VALUES)) {
        console.log('Creating DATA_VALUES store');
        const valueStore = db.createObjectStore(STORES.DATA_VALUES, { keyPath: 'uniqueKey' });
        valueStore.createIndex('by_source_period', ['source', 'period'], { unique: false });
        valueStore.createIndex('by_element_source', ['dataElement', 'source'], { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.DATA_RECORDS)) {
        console.log('Creating DATA_RECORDS store');
        const recordStore = db.createObjectStore(STORES.DATA_RECORDS, { keyPath: 'uniqueKey' });
        recordStore.createIndex('by_source_period', ['source', 'period'], { unique: false });
        recordStore.createIndex('by_element_source', ['dataElement', 'source'], { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.FAILED_DATA_VALUES)) {
        console.log('Creating FAILED_DATA_VALUES store');
        const failedValueStore = db.createObjectStore(STORES.FAILED_DATA_VALUES, { keyPath: 'uniqueKey' });
        failedValueStore.createIndex('by_source_period', ['source', 'period'], { unique: false });
        failedValueStore.createIndex('by_element_source', ['dataElement', 'source'], { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.FAILED_DATA_RECORDS)) {
        console.log('Creating FAILED_DATA_RECORDS store');
        const failedRecordStore = db.createObjectStore(STORES.FAILED_DATA_RECORDS, { keyPath: 'uniqueKey' });
        failedRecordStore.createIndex('by_source_period', ['source', 'period'], { unique: false });
        failedRecordStore.createIndex('by_element_source', ['dataElement', 'source'], { unique: false });
      }
    };
  });
};

// Get or initialize the database
export const getDB = async (): Promise<IDBDatabase> => {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  return initDB();
};

// Generate a unique key for data values
const generateValueKey = (value: DataValuePayload): string => {
  return `${value.dataElement}-${value.source}-${value.categoryOptionCombo || 'default'}`;
};

// Generate a unique key for data records
const generateRecordKey = (record: DataRecordPayload): string => {
  return `${record.dataElement}-${record.source}`;
};

// Store data value in IndexedDB
  export const storeDataValue = async (dataValue: DataValuePayload): Promise<StoredDataValue> => {
    console.log('Attempting to store data value:', dataValue);
    
    if (!dataValue.source || !dataValue.period || !dataValue.dataElement) {
      console.error('Missing required fields in data value:', dataValue);
      throw new Error('Missing required fields in data value');
    }
    
    try {
      const db = await initDB();
      
      return new Promise<DataValuePayload & { uniqueKey: string }>((resolve, reject) => {
        try {
          // Ensure store exists before transaction
          if (!db.objectStoreNames.contains(STORES.DATA_VALUES)) {
            reject(`Store ${STORES.DATA_VALUES} does not exist`);
            return;
          }
          
          const transaction = db.transaction([STORES.DATA_VALUES], 'readwrite');
          const store = transaction.objectStore(STORES.DATA_VALUES);
          
          // Generate a unique key
          const uniqueKey = generateValueKey(dataValue);
          
          // Prepare the value with the unique key
          const valueToStore = {
            ...dataValue,
            uniqueKey,
            timestamp: new Date().toISOString()
          };
          
          console.log('Storing value with key:', uniqueKey);
          const request = store.put(valueToStore);
          
          request.onsuccess = () => {
            console.log('Successfully stored data value:', uniqueKey);
            resolve(valueToStore);
          };
          
          request.onerror = (event: Event) => {
            console.error('Error in IndexedDB put operation:', (event.target as IDBRequest).error);
            reject('Error storing data value: ' + (event.target as IDBRequest).error);
          };
          
          transaction.oncomplete = () => {
            console.log('Transaction completed successfully');
          };
          
          transaction.onerror = (event: Event) => {
            console.error('Transaction error:', event);
            reject('Transaction error: ' + (event.target as IDBTransaction).error);
          };
        } catch (err) {
          console.error('Transaction setup error:', err);
          reject('Transaction setup error: ' + err);
        }
      });
    } catch (error) {
      console.error('Failed to store data value:', error);
      throw error;
    }
  };

  // Store data value in IndexedDB
  export const storeDataRecord = async (dataRecord: DataRecordPayload): Promise<StoredDataRecord> => {
    console.log('Attempting to store data record:', dataRecord);
    
    if (!dataRecord.source || !dataRecord.period || !dataRecord.dataElement) {
      console.error('Missing required fields in data record:', dataRecord);
      throw new Error('Missing required fields in data record');
    }
    
    try {
      const db = await initDB();
      
      return new Promise<DataRecordPayload & { uniqueKey: string }>((resolve, reject) => {
        try {
          // Ensure store exists before transaction
          if (!db.objectStoreNames.contains(STORES.DATA_RECORDS)) {
            reject(`Store ${STORES.DATA_RECORDS} does not exist`);
            return;
          }
          
          const transaction = db.transaction([STORES.DATA_RECORDS], 'readwrite');
          const store = transaction.objectStore(STORES.DATA_RECORDS);
          
          // Generate a unique key
          const uniqueKey = generateRecordKey(dataRecord);
          
          // Prepare the value with the unique key
          const recordToStore = {
            ...dataRecord,
            uniqueKey,
            timestamp: new Date().toISOString()
          };
          
          console.log('Storing record with key:', uniqueKey);
          const request = store.put(recordToStore);
          
          request.onsuccess = () => {
            console.log('Successfully stored data record:', uniqueKey);
            resolve(recordToStore);
          };
          
          request.onerror = (event: Event) => {
            console.error('Error in IndexedDB put operation:', (event.target as IDBRequest).error);
            reject('Error storing data record: ' + (event.target as IDBRequest).error);
          };
          
          transaction.oncomplete = () => {
            console.log('Transaction completed successfully');
          };
          
          transaction.onerror = (event: Event) => {
            console.error('Transaction error:', event);
            reject('Transaction error: ' + (event.target as IDBTransaction).error);
          };
        } catch (err) {
          console.error('Transaction setup error:', err);
          reject('Transaction setup error: ' + err);
        }
      });
    } catch (error) {
      console.error('Failed to store data record:', error);
      throw error;
    }
  };

// Get all data values for a specific period and source
export const getDataValues = async (period: string, source: string): Promise<StoredDataValue[]> => {
  try {
    const db = await initDB();
    return new Promise<(DataValuePayload & { uniqueKey: string })[]>((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA_VALUES], 'readonly');
      const store = transaction.objectStore(STORES.DATA_VALUES);
      const index = store.index('by_source_period');
      
      const request = index.getAll([source, period]);
      
      request.onsuccess = (event: Event) => {
        const values = (event.target as IDBRequest).result;
        resolve(values);
      };
      
      request.onerror = (event: Event) => {
        reject('Error getting data values: ' + (event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('Failed to get data values:', error);
    throw error;
  }
};

// Get all data records for a specific period and source
export const getDataRecords = async (period: string, source: string): Promise<(DataRecordPayload & { uniqueKey: string })[]> => {
  try {
    const db = await initDB();
    return new Promise<(DataRecordPayload & { uniqueKey: string })[]>((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA_RECORDS], 'readonly');
      const store = transaction.objectStore(STORES.DATA_RECORDS);
      const index = store.index('by_source_period');
      
      const request = index.getAll([source, period]);
      
      request.onsuccess = (event: Event) => {
        const records = (event.target as IDBRequest).result;
        resolve(records);
      };
      
      request.onerror = (event: Event) => {
        reject('Error getting data records: ' + (event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('Failed to get data records:', error);
    throw error;
  }
};

// Get data values by section based on data element mappings
export const getDataValuesBySection = async (
  period: string, 
  source: string, 
  sectionMap: Record<string, string[]>
): Promise<Record<string, (DataValuePayload & { uniqueKey: string })[]>> => {
  try {
    const values = await getDataValues(period, source);
    const valuesBySection: Record<string, (DataValuePayload & { uniqueKey: string })[]> = {};
    
    // Initialize sections
    Object.keys(sectionMap).forEach(sectionId => {
      valuesBySection[sectionId] = [];
    });
    
    // Group values by section
    values.forEach(value => {
      const dataElementId = value.dataElement;
      for (const [sectionId, elements] of Object.entries(sectionMap)) {
        if (elements.includes(dataElementId)) {
          valuesBySection[sectionId].push(value);
          break;
        }
      }
    });
    
    return valuesBySection;
  } catch (error) {
    console.error('Failed to group data values by section:', error);
    throw error;
  }
};

// Get data records by section based on data element mappings
export const getDataRecordsBySection = async (
  period: string, 
  source: string, 
  sectionMap: Record<string, string[]>
): Promise<Record<string, (DataRecordPayload & { uniqueKey: string })[]>> => {
  try {
    const records = await getDataRecords(period, source);
    const recordsBySection: Record<string, (DataRecordPayload & { uniqueKey: string })[]> = {};
    
    // Initialize sections
    Object.keys(sectionMap).forEach(sectionId => {
      recordsBySection[sectionId] = [];
    });
    
    // Group records by section
    records.forEach(record => {
      const dataElementId = record.dataElement;
      for (const [sectionId, elements] of Object.entries(sectionMap)) {
        if (elements.includes(dataElementId)) {
          recordsBySection[sectionId].push(record);
          break;
        }
      }
    });
    
    return recordsBySection;
  } catch (error) {
    console.error('Failed to group data records by section:', error);
    throw error;
  }
};

// Delete all data for a specific period and source
export const deleteAllData = async (period: string, source: string): Promise<boolean> => {
  try {
    const db = await initDB();
    
    // Delete data values
    const valuePromise = new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA_VALUES], 'readwrite');
      const store = transaction.objectStore(STORES.DATA_VALUES);
      const index = store.index('by_source_period');
      
      const request = index.openCursor(IDBKeyRange.only([source, period]));
      
      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = (event: Event) => {
        reject('Error deleting data values: ' + (event.target as IDBRequest).error);
      };
    });
    
    // Delete data records
    const recordPromise = new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.DATA_RECORDS], 'readwrite');
      const store = transaction.objectStore(STORES.DATA_RECORDS);
      const index = store.index('by_source_period');
      
      const request = index.openCursor(IDBKeyRange.only([source, period]));
      
      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = (event: Event) => {
        reject('Error deleting data records: ' + (event.target as IDBRequest).error);
      };
    });
    
    await Promise.all([valuePromise, recordPromise]);
    return true;
  } catch (error) {
    console.error('Failed to delete data:', error);
    throw error;
  }
};

/**
 * Stores a data record that failed to submit to the server
 * @param record The data record that failed to submit
 * @returns Promise resolving to the stored record
 */
export const storeFailedDataRecord = async (record: DataRecordPayload): Promise<StoredDataRecord> => {
  const db = await getDB();
  const transaction = db.transaction([STORES.FAILED_DATA_RECORDS], 'readwrite');
  const store = transaction.objectStore(STORES.FAILED_DATA_RECORDS);
  
  // Add a uniqueKey and timestamp for tracking
  const recordToStore = {
    ...record,
    uniqueKey: `failed-${record.dataElement}-${record.source}-${record.period}-${Date.now()}`,
    failedTimestamp: new Date()
  };
  
  const request = store.add(recordToStore);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(recordToStore);
    request.onerror = () => reject(new Error('Failed to store failed data record'));
  });
};

/**
 * Stores a data value that failed to submit to the server
 * @param value The data value that failed to submit
 * @returns Promise resolving to the stored value
 */
export const storeFailedDataValue = async (value: DataValuePayload): Promise<StoredDataValue> => {
  const db = await getDB();
  const transaction = db.transaction([STORES.FAILED_DATA_VALUES], 'readwrite');
  const store = transaction.objectStore(STORES.FAILED_DATA_VALUES);
  
  // Add a uniqueKey and timestamp for tracking
  const valueToStore = {
    ...value,
    uniqueKey: `failed-${value.dataElement}-${value.categoryOptionCombo}-${value.source}-${value.period}-${Date.now()}`,
    failedTimestamp: new Date()
  };
  
  const request = store.add(valueToStore);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(valueToStore);
    request.onerror = () => reject(new Error('Failed to store failed data value'));
  });
};

/**
 * Retrieves all failed data records
 * @returns Promise resolving to an array of failed records
 */
export const getFailedDataRecords = async (): Promise<StoredDataRecord[]> => {
  const db = await getDB();
  const transaction = db.transaction([STORES.FAILED_DATA_RECORDS], 'readonly');
  const store = transaction.objectStore(STORES.FAILED_DATA_RECORDS);
  
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to retrieve failed data records'));
  });
};

/**
 * Retrieves all failed data values
 * @returns Promise resolving to an array of failed values
 */
export const getFailedDataValues = async (): Promise<StoredDataValue[]> => {
  const db = await getDB();
  const transaction = db.transaction([STORES.FAILED_DATA_VALUES], 'readonly');
  const store = transaction.objectStore(STORES.FAILED_DATA_VALUES);
  
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to retrieve failed data values'));
  });
};



export const removeFailedDataRecord = async (uniqueKey: string): Promise<void> => {
  const db = await getDB();
  const transaction = db.transaction([STORES.FAILED_DATA_RECORDS], 'readwrite');
  const store = transaction.objectStore(STORES.FAILED_DATA_RECORDS);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(uniqueKey);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const removeFailedDataValue = async (uniqueKey: string): Promise<void> => {
  const db = await getDB();
  const transaction = db.transaction([STORES.FAILED_DATA_VALUES], 'readwrite');
  const store = transaction.objectStore(STORES.FAILED_DATA_VALUES);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(uniqueKey);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const retryFailedDataRecord = async (uniqueKey: string): Promise<boolean> => {
  const db = await getDB();
  const transaction = db.transaction([STORES.FAILED_DATA_RECORDS], 'readwrite');
  const store = transaction.objectStore(STORES.FAILED_DATA_RECORDS);
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(uniqueKey);
    
    getRequest.onsuccess = async () => {
      const record = getRequest.result;
      if (!record) {
        resolve(false);
        return;
      }
      
      try {
        // Attempt to submit to server
        await submitToServer(record, 'record');
        
        // If successful, remove from failed records store
        await removeFailedDataRecord(uniqueKey);
        resolve(true);
      } catch (error) {
        // Update last sync attempt
        record.lastSyncAttempt = new Date();
        await store.put(record);
        resolve(false);
      }
    };
    
    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
};

export const retryFailedDataValue = async (uniqueKey: string): Promise<boolean> => {
  const db = await getDB();
  const transaction = db.transaction([STORES.FAILED_DATA_VALUES], 'readwrite');
  const store = transaction.objectStore(STORES.FAILED_DATA_VALUES);
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(uniqueKey);
    
    getRequest.onsuccess = async () => {
      const value = getRequest.result;
      if (!value) {
        resolve(false);
        return;
      }
      
      try {
        // Attempt to submit to server
        await submitToServer(value, 'value');
        
        // If successful, remove from failed values store
        await removeFailedDataValue(uniqueKey);
        resolve(true);
      } catch (error) {
        // Update last sync attempt
        value.lastSyncAttempt = new Date();
        await store.put(value);
        resolve(false);
      }
    };
    
    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
};

// Function to retry all failed records and values
export const retryAllFailedData = async (): Promise<{ records: number, values: number }> => {
  const failedRecords = await getFailedDataRecords();
  const failedValues = await getFailedDataValues();
  
  let successfulRecords = 0;
  let successfulValues = 0;
  
  // Retry records
  for (const record of failedRecords) {
    if (await retryFailedDataRecord(record.uniqueKey)) {
      successfulRecords++;
    }
  }
  
  // Retry values
  for (const value of failedValues) {
    if (await retryFailedDataValue(value.uniqueKey)) {
      successfulValues++;
    }
  }
  
  return { records: successfulRecords, values: successfulValues };
};