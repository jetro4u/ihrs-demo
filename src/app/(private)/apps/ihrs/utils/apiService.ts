// apiService.ts

/**
 * Simulates submission to a server API
 * @param payload The data to submit
 * @param type The type of submission ('record' or 'value')
 * @returns Promise that resolves with a success response or rejects with an error
 */
export const submitToServer = async (payload: any, type: 'record' | 'value'): Promise<any> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  // Simulate occasional random failures (20% failure rate for demo purposes)
  if (Math.random() < 0.2) {
    throw new Error(`Server ${type === 'record' ? 'record' : 'value'} submission failed: Network error`);
  }
  
  // Success response
  return {
    status: 'SUCCESS',
    id: `server-${type}-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
};

/**
 * Simulates retry of previously failed submissions
 * @param failedItems Array of failed items to retry
 * @param type The type of submission ('record' or 'value')
 * @returns Promise that resolves with results for each item
 */
export const retryFailedSubmissions = async (failedItems: any[], type: 'record' | 'value'): Promise<{
  successful: any[],
  failed: any[]
}> => {
  const successful = [];
  const failed = [];
  
  // Process each item
  for (const item of failedItems) {
    try {
      const result = await submitToServer(item, type);
      successful.push({
        item,
        result
      });
    } catch (error) {
      failed.push({
        item,
        error: error.message
      });
    }
  }
  
  return { successful, failed };
};