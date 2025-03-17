/*
import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';
import { AccountStatus } from '@domspec/type';

const tenantsApi = [
  
  http.get('/api/mock/tenants', async ({ request }) => {
    const api = mockApi('tenants');
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    
    // Extract pagination params
    const page = Number(queryParams.page) || 1;
    const pageSize = Number(queryParams.pageSize) || 50;
    
    // Extract filter params
    const { status, tenantType, sector, ...otherParams } = queryParams;
    
    // Build filter object for the mockApi
    const filters = { ...otherParams };
    if (status) filters.status = status;
    if (tenantType) filters.tenantType = tenantType;
    if (sector) filters.sector = sector;
    
    const items = await api.findAll({
      ...filters,
      _page: page,
      _limit: pageSize
    });
    
    // Get total count for pagination
    const total = await api.count(filters);
    
    return HttpResponse.json({
      tenants: items,
      total
    });
  }),

  
  http.post('/api/mock/tenants', async ({ request }) => {
    const api = mockApi('tenants');
    const data = await request.json() as Record<string, unknown>;
    
    // Generate default values if not provided
    if (!data.apiToken) {
      const name = data.name as string;
      data.apiToken = generateMockApiToken(name);
    }
    
    if (!data.accountId) {
      data.accountId = `tenant_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Set default values
    data.accountType = data.accountType || 'tenant';
    data.status = data.status || 'active';
    data.settings = data.settings || {};
    
    const newItem = await api.create(data);
    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.get('/api/mock/tenants/:id', async ({ params }) => {
    const api = mockApi('tenants');
    const { id } = params as Record<string, string>;
    
    // First try to find by ID
    let item = await api.find(id);
    
    // If not found, try to find by UUID
    if (!item) {
      const allItems = await api.findAll({});
      item = allItems.find(tenant => tenant.uuid === id);
    }

    if (!item) {
      return HttpResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  http.get('/api/mock/tenants/account/:accountId', async ({ params }) => {
    const api = mockApi('tenants');
    const { accountId } = params as Record<string, string>;
    
    const allItems = await api.findAll({});
    const item = allItems.find(tenant => tenant.accountId === accountId);

    if (!item) {
      return HttpResponse.json({ message: 'Tenant not found with the provided account ID' }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  
  http.get('/api/mock/tenants/token/:apiToken', async ({ params }) => {
    const api = mockApi('tenants');
    const { apiToken } = params as Record<string, string>;
    
    const allItems = await api.findAll({});
    const item = allItems.find(tenant => tenant.apiToken === apiToken);

    if (!item) {
      return HttpResponse.json({ message: 'Tenant not found with the provided API token' }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  http.get('/api/mock/tenants/type/:tenantType', async ({ params }) => {
    const api = mockApi('tenants');
    const { tenantType } = params as Record<string, string>;
    
    const allItems = await api.findAll({});
    const items = allItems.filter(tenant => tenant.tenantType === tenantType);

    if (items.length === 0) {
      return HttpResponse.json({ message: 'No tenants found with the provided type' }, { status: 404 });
    }

    return HttpResponse.json(items);
  }),

  http.get('/api/mock/tenants/parent/:parentAccountId', async ({ params }) => {
    const api = mockApi('tenants');
    const { parentAccountId } = params as Record<string, string>;
    
    const allItems = await api.findAll({});
    const items = allItems.filter(tenant => tenant.parentAccountId === parentAccountId);

    return HttpResponse.json(items);
  }),

 
  http.put('/api/mock/tenants/:id', async ({ params, request }) => {
    const api = mockApi('tenants');
    const { id } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    // Add updated_at timestamp
    data.updatedAt = new Date().toISOString();
    
    // First try to update by ID
    let updatedItem = await api.update(id, data);
    
    // If not found, try to update by UUID
    if (!updatedItem) {
      const allItems = await api.findAll({});
      const item = allItems.find(tenant => tenant.uuid === id);
      
      if (item) {
        updatedItem = await api.update(item.id, data);
      }
    }

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  http.delete('/api/mock/tenants/:id', async ({ params }) => {
    const api = mockApi('tenants');
    const { id } = params as Record<string, string>;
    
    // First try to delete by ID
    let result = await api.delete([id]);
    
    // If not found, try to delete by UUID
    if (!result.success) {
      const allItems = await api.findAll({});
      const item = allItems.find(tenant => tenant.uuid === id);
      
      if (item) {
        result = await api.delete([item.id]);
      }
    }

    if (!result.success) {
      return HttpResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Deleted successfully' });
  }),

  http.post('/api/mock/tenants/:id/status', async ({ params, request }) => {
    const api = mockApi('tenants');
    const { id } = params as Record<string, string>;
    const { status } = await request.json() as { status: AccountStatus };
    
    // Find the tenant
    let tenant = await api.find(id);
    
    // If not found by ID, try UUID
    if (!tenant) {
      const allItems = await api.findAll({});
      tenant = allItems.find(tenant => tenant.uuid === id);
      
      if (tenant) {
        id = tenant.id;
      }
    }

    if (!tenant) {
      return HttpResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }
    
    // Update status
    const updatedItem = await api.update(id, {
      status,
      updatedAt: new Date().toISOString()
    });

    return HttpResponse.json(updatedItem);
  }),

  
  http.post('/api/mock/tenants/:id/refresh-token', async ({ params }) => {
    const api = mockApi('tenants');
    const { id } = params as Record<string, string>;
    
    // Find the tenant
    let tenant = await api.find(id);
    
    // If not found by ID, try UUID
    if (!tenant) {
      const allItems = await api.findAll({});
      tenant = allItems.find(tenant => tenant.uuid === id);
      
      if (tenant) {
        id = tenant.id;
      }
    }

    if (!tenant) {
      return HttpResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }
    
    // Generate new API token
    const newApiToken = generateMockApiToken(tenant.name);
    
    // Update token
    await api.update(id, {
      apiToken: newApiToken,
      updatedAt: new Date().toISOString()
    });

    return HttpResponse.json({ apiToken: newApiToken });
  }),

  http.post('/api/mock/tenants/:id/child-account', async ({ params, request }) => {
    const api = mockApi('tenants');
    const { id } = params as Record<string, string>;
    const { childAccountId } = await request.json() as { childAccountId: string };
    
    // Find the tenant
    let tenant = await api.find(id);
    
    // If not found by ID, try UUID
    if (!tenant) {
      const allItems = await api.findAll({});
      tenant = allItems.find(tenant => tenant.uuid === id);
      
      if (tenant) {
        id = tenant.id;
      }
    }

    if (!tenant) {
      return HttpResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }
    
    // Add child account if not already in the list
    const childAccounts = tenant.childAccounts || [];
    if (!childAccounts.includes(childAccountId)) {
      childAccounts.push(childAccountId);
    }
    
    // Update tenant
    const updatedItem = await api.update(id, {
      childAccounts,
      updatedAt: new Date().toISOString()
    });

    return HttpResponse.json(updatedItem);
  }),

  
  http.post('/api/mock/tenants/:id/linked-account', async ({ params, request }) => {
    const api = mockApi('tenants');
    const { id } = params as Record<string, string>;
    const { linkedAccountId, relationship } = await request.json() as { 
      linkedAccountId: string, 
      relationship: string 
    };
    
    // Find the tenant
    let tenant = await api.find(id);
    
    // If not found by ID, try UUID
    if (!tenant) {
      const allItems = await api.findAll({});
      tenant = allItems.find(tenant => tenant.uuid === id);
      
      if (tenant) {
        id = tenant.id;
      }
    }

    if (!tenant) {
      return HttpResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }
    
    // Add or update linked account
    const linkedAccounts = tenant.linkedAccounts || [];
    const existingIndex = linkedAccounts.findIndex(acc => acc.accountId === linkedAccountId);
    
    if (existingIndex >= 0) {
      linkedAccounts[existingIndex].relationship = relationship;
    } else {
      linkedAccounts.push({
        accountId: linkedAccountId,
        relationship
      });
    }
    
    // Update tenant
    const updatedItem = await api.update(id, {
      linkedAccounts,
      updatedAt: new Date().toISOString()
    });

    return HttpResponse.json(updatedItem);
  }),

  http.post('/api/mock/tenants/validate-token', async ({ request }) => {
    const api = mockApi('tenants');
    const { apiToken } = await request.json() as { apiToken: string };
    
    // Find tenant by token
    const allItems = await api.findAll({});
    const tenant = allItems.find(tenant => tenant.apiToken === apiToken);

    if (!tenant) {
      return HttpResponse.json({ valid: false }, { status: 404 });
    }

    return HttpResponse.json({ 
      valid: true,
      tenantId: tenant.id,
      uuid: tenant.uuid,
      name: tenant.name,
      status: tenant.status
    });
  })
];

// Helper function to generate a mock API token
function generateMockApiToken(tenantName: string): string {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const baseString = `${tenantName}-${timestamp}-${randomStr}`;
  
  // Simple hash function for mock
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hexHash}-${randomStr}-${timestamp.toString(36)}`;
}

export default tenantsApi;
*/