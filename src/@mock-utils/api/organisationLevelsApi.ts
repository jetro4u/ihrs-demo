import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

const organisationLevelsApi = [
  /**
   * GET /api/v1/organisationLevels
   */
  http.get('/api/v1/organisationLevels', async ({ request }) => {
    const api = mockApi('organisation_levels');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    return HttpResponse.json(items);
  }),

  /**
   * POST /api/v1/organisationLevels
   */
  http.post('/api/v1/organisationLevels', async ({ request }) => {
    const api = mockApi('organisation_levels');
    const data = (await request.json()) as Record<string, unknown>;
    const newItem = await api.create(data);
    return HttpResponse.json(newItem, { status: 201 });
  }),

  /**
   * GET /api/v1/organisationLevels/gist
   */
  http.get('/api/v1/organisationLevels/gist', async ({ request }) => {
    const api = mockApi('organisation_levels');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    // Transform to gist format
    return HttpResponse.json(items);
  }),

  /**
   * GET /api/v1/organisationLevels/gist.csv
   */
  http.get('/api/v1/organisationLevels/gist.csv', async ({ request }) => {
    const api = mockApi('organisation_levels');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    // Convert to CSV format (simplified for mock)
    return HttpResponse.text('id,name,code,level\n' + items.map((item: any) => 
      `${item.id},${item.name},${item.code},${item.level}`).join('\n'));
  }),

  /**
   * PATCH /api/v1/organisationLevels/sharing
   */
  http.patch('/api/v1/organisationLevels/sharing', async ({ request }) => {
    const data = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, message: 'Sharing modified' });
  }),

  /**
   * GET /api/v1/organisationLevels/:uuid
   */
  http.get('/api/v1/organisationLevels/:uuid', async ({ params }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  /**
   * PUT /api/v1/organisationLevels/:uuid
   */
  http.put('/api/v1/organisationLevels/:uuid', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const updatedItem = await api.update(uuid, data);

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * PATCH /api/v1/organisationLevels/:uuid
   */
  http.patch('/api/v1/organisationLevels/:uuid', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const { operations } = await request.json() as { operations: Array<{op: string; path: string; value: any}> };
    
    const item = await api.find(uuid);
    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    const updatedData: Record<string, unknown> = { ...item };
    
    // Simple implementation of JSON patch operations
    operations.forEach(op => {
      if (op.op === 'replace') {
        const path = op.path.replace('/', '');
        updatedData[path] = op.value;
      }
    });
    
    const updatedItem = await api.update(uuid, updatedData);
    return HttpResponse.json(updatedItem);
  }),

  /**
   * DELETE /api/v1/organisationLevels/:uuid
   */
  http.delete('/api/v1/organisationLevels/:uuid', async ({ params }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const success = await api.delete(uuid);

    if (!success) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Organisation level deleted successfully' });
  }),

  /**
   * POST /api/v1/organisationLevels/:uuid/favorite
   */
  http.post('/api/v1/organisationLevels/:uuid/favorite', async ({ params }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Simulate adding to favorites
    const updatedItem = await api.update(uuid, { ...item, isFavorite: true });
    return HttpResponse.json({ message: 'Added to favorites', item: updatedItem });
  }),

  /**
   * DELETE /api/v1/organisationLevels/:uuid/favorite
   */
  http.delete('/api/v1/organisationLevels/:uuid/favorite', async ({ params }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Simulate removing from favorites
    const updatedItem = await api.update(uuid, { ...item, isFavorite: false });
    return HttpResponse.json({ message: 'Removed from favorites', item: updatedItem });
  }),

  /**
   * GET /api/v1/organisationLevels/:uuid/gist
   */
  http.get('/api/v1/organisationLevels/:uuid/gist', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Transform to gist format - simplified for mock
    const gist = {
      id: item.id,
      name: item.name,
      code: item.code,
      level: item.level,
      displayName: item.displayName,
    };

    return HttpResponse.json(gist);
  }),

  /**
   * GET /api/v1/organisationLevels/:uuid/gist.csv
   */
  http.get('/api/v1/organisationLevels/:uuid/gist.csv', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.text('Not found', { status: 404 });
    }

    // Convert to CSV format (simplified for mock)
    return HttpResponse.text(`id,name,code,level\n${item.id},${item.name},${item.code},${item.level}`);
  }),

  /**
   * PUT /api/v1/organisationLevels/:uuid/sharing
   */
  http.put('/api/v1/organisationLevels/:uuid/sharing', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const sharingData = await request.json() as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    const updatedItem = await api.update(uuid, { ...item, sharing: sharingData });
    return HttpResponse.json({ message: 'Sharing updated successfully', item: updatedItem });
  }),

  /**
   * POST /api/v1/organisationLevels/:uuid/subscriber
   */
  http.post('/api/v1/organisationLevels/:uuid/subscriber', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const subscriberData = await request.json() as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Add subscriber logic
    const subscribers = item.subscribers || [];
    const updatedItem = await api.update(uuid, { 
      ...item, 
      subscribers: [...subscribers, subscriberData] 
    });

    return HttpResponse.json({ message: 'Subscriber added', item: updatedItem }, { status: 201 });
  }),

  /**
   * DELETE /api/v1/organisationLevels/:uuid/subscriber
   */
  http.delete('/api/v1/organisationLevels/:uuid/subscriber', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const { subscriberId } = await request.json() as { subscriberId: string };
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Remove subscriber logic
    const subscribers = item.subscribers || [];
    const updatedSubscribers = subscribers.filter((sub: any) => sub.id !== subscriberId);
    const updatedItem = await api.update(uuid, { 
      ...item, 
      subscribers: updatedSubscribers 
    });

    return HttpResponse.json({ message: 'Subscriber removed', item: updatedItem });
  }),

  /**
   * PUT /api/v1/organisationLevels/:uuid/translations
   */
  http.put('/api/v1/organisationLevels/:uuid/translations', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid } = params as Record<string, string>;
    const translations = await request.json() as Array<Record<string, unknown>>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    const updatedItem = await api.update(uuid, { ...item, translations });
    return HttpResponse.json({ message: 'Translations updated', item: updatedItem });
  }),

  /**
   * GET /api/v1/organisationLevels/:uuid/:property
   */
  http.get('/api/v1/organisationLevels/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    if (!(property in item)) {
      return HttpResponse.json({ message: `Property ${property} not found` }, { status: 404 });
    }

    return HttpResponse.json({ [property]: item[property as keyof typeof item] });
  }),

  /**
   * POST /api/v1/organisationLevels/:uuid/:property
   */
  http.post('/api/v1/organisationLevels/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property } = params as Record<string, string>;
    const { additions, deletions, identifiableObjects } = await request.json() as { 
      additions: Array<Record<string, unknown>>,
      deletions: Array<Record<string, unknown>>,
      identifiableObjects: Array<Record<string, unknown>>
    };
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Simplified property modification logic
    let propertyValue = item[property as keyof typeof item] || [];
    if (!Array.isArray(propertyValue)) {
      return HttpResponse.json({ message: `Property ${property} is not an array` }, { status: 400 });
    }

    // Apply changes
    if (additions && additions.length > 0) {
      propertyValue = [...propertyValue, ...additions];
    }

    const updatedItem = await api.update(uuid, { ...item, [property]: propertyValue });
    return HttpResponse.json({ message: `Property ${property} created`, item: updatedItem }, { status: 201 });
  }),

  /**
   * PUT /api/v1/organisationLevels/:uuid/:property
   */
  http.put('/api/v1/organisationLevels/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property } = params as Record<string, string>;
    const { additions, deletions, identifiableObjects } = await request.json() as { 
      additions: Array<Record<string, unknown>>,
      deletions: Array<Record<string, unknown>>,
      identifiableObjects: Array<Record<string, unknown>>
    };
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Replace the entire property
    const updatedItem = await api.update(uuid, { ...item, [property]: identifiableObjects || [] });
    return HttpResponse.json({ message: `Property ${property} updated`, item: updatedItem });
  }),

  /**
   * PATCH /api/v1/organisationLevels/:uuid/:property
   */
  http.patch('/api/v1/organisationLevels/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property } = params as Record<string, string>;
    const updateData = await request.json() as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Update the property with the provided data
    const updatedItem = await api.update(uuid, { ...item, [property]: updateData });
    return HttpResponse.json({ message: `Property ${property} modified`, item: updatedItem });
  }),

  /**
   * DELETE /api/v1/organisationLevels/:uuid/:property
   */
  http.delete('/api/v1/organisationLevels/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property } = params as Record<string, string>;
    const body = await request.json() as { 
      additions?: Array<Record<string, unknown>>,
      deletions?: Array<Record<string, unknown>>,
      identifiableObjects?: Array<Record<string, unknown>>
    };
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // For delete, we'll remove the property entirely
    const { [property as keyof typeof item]: _, ...restItem } = item;
    const updatedItem = await api.update(uuid, restItem);
    
    return HttpResponse.json({ message: `Property ${property} deleted`, item: updatedItem });
  }),

  /**
   * GET /api/v1/organisationLevels/:uuid/:property/gist
   */
  http.get('/api/v1/organisationLevels/:uuid/:property/gist', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    if (!(property in item)) {
      return HttpResponse.json({ message: `Property ${property} not found` }, { status: 404 });
    }

    // Return gist of the property
    return HttpResponse.json({ [property]: item[property as keyof typeof item] });
  }),

  /**
   * GET /api/v1/organisationLevels/:uuid/:property/gist.csv
   */
  http.get('/api/v1/organisationLevels/:uuid/:property/gist.csv', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.text('Not found', { status: 404 });
    }

    if (!(property in item)) {
      return HttpResponse.text(`Property ${property} not found`, { status: 404 });
    }

    const propertyValue = item[property as keyof typeof item];
    
    // Convert to CSV (simplified)
    if (Array.isArray(propertyValue)) {
      const headers = Object.keys(propertyValue[0] || {}).join(',');
      const rows = propertyValue.map(row => 
        Object.values(row).join(',')
      ).join('\n');
      
      return HttpResponse.text(`${headers}\n${rows}`);
    }
    
    // For non-array properties, return key-value pairs
    return HttpResponse.text(`key,value\n${property},${JSON.stringify(propertyValue)}`);
  }),

  /**
   * POST /api/v1/organisationLevels/:uuid/:property/:itemId
   */
  http.post('/api/v1/organisationLevels/:uuid/:property/:itemId', async ({ params, request }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property, itemId } = params as Record<string, string>;
    const itemData = await request.json() as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Add or update item in the property array
    let propertyArray = item[property as keyof typeof item] || [];
    if (!Array.isArray(propertyArray)) {
      return HttpResponse.json({ message: `Property ${property} is not an array` }, { status: 400 });
    }

    // Add the new item with its ID
    propertyArray = [...propertyArray, { ...itemData, id: itemId }];
    
    const updatedItem = await api.update(uuid, { ...item, [property]: propertyArray });
    return HttpResponse.json({ message: `Item added to ${property}`, item: updatedItem }, { status: 201 });
  }),

  /**
   * DELETE /api/v1/organisationLevels/:uuid/:property/:itemId
   */
  http.delete('/api/v1/organisationLevels/:uuid/:property/:itemId', async ({ params }) => {
    const api = mockApi('organisation_levels');
    const { uuid, property, itemId } = params as Record<string, string>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Organisation level not found' }, { status: 404 });
    }

    // Remove the item from the property array
    let propertyArray = item[property as keyof typeof item] || [];
    if (!Array.isArray(propertyArray)) {
      return HttpResponse.json({ message: `Property ${property} is not an array` }, { status: 400 });
    }

    // Filter out the item with the matching ID
    propertyArray = propertyArray.filter((propItem: any) => propItem.id !== itemId);
    
    const updatedItem = await api.update(uuid, { ...item, [property]: propertyArray });
    return HttpResponse.json({ message: `Item removed from ${property}`, item: updatedItem });
  }),
];

export default organisationLevelsApi;