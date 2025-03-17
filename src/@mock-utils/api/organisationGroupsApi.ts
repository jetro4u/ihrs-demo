import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

const organisationGroupsApi = [
  /**
   * GET /api/v1/organisationGroups
   */
  http.get('/api/v1/organisationGroups', async ({ request }) => {
    const api = mockApi('organisation_groups');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    return HttpResponse.json(items);
  }),

  /**
   * POST /api/v1/organisationGroups
   */
  http.post('/api/v1/organisationGroups', async ({ request }) => {
    const api = mockApi('organisation_groups');
    const data = (await request.json()) as Record<string, unknown>;
    const newItem = await api.create(data);
    return HttpResponse.json(newItem, { status: 201 });
  }),

  /**
   * GET /api/v1/organisationGroups/gist
   */
  http.get('/api/v1/organisationGroups/gist', async ({ request }) => {
    const api = mockApi('organisation_groups');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    return HttpResponse.json(items);
  }),

  /**
   * GET /api/v1/organisationGroups/gist.csv
   */
  http.get('/api/v1/organisationGroups/gist.csv', async ({ request }) => {
    const api = mockApi('organisation_groups');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    // Here we would normally convert to CSV
    return new HttpResponse(JSON.stringify(items), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv'
      }
    });
  }),

  /**
   * PATCH /api/v1/organisationGroups/sharing
   */
  http.patch('/api/v1/organisationGroups/sharing', async ({ request }) => {
    const api = mockApi('organisation_groups_sharing');
    const data = (await request.json()) as Record<string, unknown>;
    const result = await api.updateMany([data]);
    return HttpResponse.json(result);
  }),

  /**
   * GET /api/v1/organisationGroups/:uuid
   */
  http.get('/api/v1/organisationGroups/:uuid', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid, queryParams);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  /**
   * PUT /api/v1/organisationGroups/:uuid
   */
  http.put('/api/v1/organisationGroups/:uuid', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const updatedItem = await api.update(uuid, data);

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * PATCH /api/v1/organisationGroups/:uuid
   */
  http.patch('/api/v1/organisationGroups/:uuid', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const updatedItem = await api.update(uuid, data);

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * DELETE /api/v1/organisationGroups/:uuid
   */
  http.delete('/api/v1/organisationGroups/:uuid', async ({ params }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const result = await api.delete([uuid]);

    if (!result.success) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Deleted successfully' });
  }),

  /**
   * POST /api/v1/organisationGroups/:uuid/favorite
   */
  http.post('/api/v1/organisationGroups/:uuid/favorite', async ({ params }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const updatedItem = await api.update(uuid, { ...item, favorite: true });
    return HttpResponse.json(updatedItem);
  }),

  /**
   * DELETE /api/v1/organisationGroups/:uuid/favorite
   */
  http.delete('/api/v1/organisationGroups/:uuid/favorite', async ({ params }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const updatedItem = await api.update(uuid, { ...item, favorite: false });
    return HttpResponse.json(updatedItem);
  }),

  /**
   * GET /api/v1/organisationGroups/:uuid/gist
   */
  http.get('/api/v1/organisationGroups/:uuid/gist', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid, queryParams);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  /**
   * GET /api/v1/organisationGroups/:uuid/gist.csv
   */
  http.get('/api/v1/organisationGroups/:uuid/gist.csv', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid, queryParams);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    // Here we would normally convert to CSV
    return new HttpResponse(JSON.stringify(item), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv'
      }
    });
  }),

  /**
   * PUT /api/v1/organisationGroups/:uuid/sharing
   */
  http.put('/api/v1/organisationGroups/:uuid/sharing', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const updatedItem = await api.update(uuid, { ...item, sharing: data });
    return HttpResponse.json(updatedItem);
  }),

  /**
   * POST /api/v1/organisationGroups/:uuid/subscriber
   */
  http.post('/api/v1/organisationGroups/:uuid/subscriber', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const subscribers = item.subscribers || [];
    const updatedItem = await api.update(uuid, { 
      ...item, 
      subscribers: [...subscribers, data] 
    });
    
    return HttpResponse.json(updatedItem, { status: 201 });
  }),

  /**
   * DELETE /api/v1/organisationGroups/:uuid/subscriber
   */
  http.delete('/api/v1/organisationGroups/:uuid/subscriber', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const subscribers = item.subscribers || [];
    const updatedItem = await api.update(uuid, {
      ...item,
      subscribers: subscribers.filter((sub: Record<string, unknown>) => sub.id !== data.id)
    });
    
    return HttpResponse.json(updatedItem);
  }),

  /**
   * PUT /api/v1/organisationGroups/:uuid/translations
   */
  http.put('/api/v1/organisationGroups/:uuid/translations', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const updatedItem = await api.update(uuid, { ...item, translations: data });
    return HttpResponse.json(updatedItem);
  }),

  /**
   * GET /api/v1/organisationGroups/:uuid/:property
   */
  http.get('/api/v1/organisationGroups/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid, queryParams);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (!(property in item)) {
      return HttpResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    return HttpResponse.json({ [property]: item[property] });
  }),

  /**
   * POST /api/v1/organisationGroups/:uuid/:property
   */
  http.post('/api/v1/organisationGroups/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property } = params as Record<string, string>;
    const data = (await request.json()) as { 
      additions?: Array<Record<string, unknown>>, 
      deletions?: Array<Record<string, unknown>>, 
      identifiableObjects?: Array<Record<string, unknown>> 
    };
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (!Array.isArray(item[property])) {
      return HttpResponse.json({ message: 'Property is not an array' }, { status: 400 });
    }

    // Handle additions to the property array
    if (data.additions) {
      const updatedProperty = [...item[property], ...data.additions];
      const updatedItem = await api.update(uuid, { ...item, [property]: updatedProperty });
      return HttpResponse.json(updatedItem, { status: 201 });
    }

    return HttpResponse.json({ message: 'No changes made' });
  }),

  /**
   * PUT /api/v1/organisationGroups/:uuid/:property
   */
  http.put('/api/v1/organisationGroups/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property } = params as Record<string, string>;
    const data = (await request.json()) as { 
      additions?: Array<Record<string, unknown>>, 
      deletions?: Array<Record<string, unknown>>, 
      identifiableObjects?: Array<Record<string, unknown>> 
    };
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    // For PUT, we're replacing the entire property with identifiableObjects
    if (data.identifiableObjects) {
      const updatedItem = await api.update(uuid, { ...item, [property]: data.identifiableObjects });
      return HttpResponse.json(updatedItem);
    }

    return HttpResponse.json({ message: 'No changes made' });
  }),

  /**
   * PATCH /api/v1/organisationGroups/:uuid/:property
   */
  http.patch('/api/v1/organisationGroups/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    // For PATCH, we're updating the property with the provided data
    const updatedItem = await api.update(uuid, { ...item, [property]: data });
    return HttpResponse.json(updatedItem);
  }),

  /**
   * DELETE /api/v1/organisationGroups/:uuid/:property
   */
  http.delete('/api/v1/organisationGroups/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property } = params as Record<string, string>;
    const data = (await request.json()) as { 
      additions?: Array<Record<string, unknown>>, 
      deletions?: Array<Record<string, unknown>>, 
      identifiableObjects?: Array<Record<string, unknown>> 
    };
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (!Array.isArray(item[property])) {
      return HttpResponse.json({ message: 'Property is not an array' }, { status: 400 });
    }

    // Handle deletions from the property array
    if (data.deletions) {
      const idsToDelete = data.deletions.map(d => d.id);
      const updatedProperty = item[property].filter((p: Record<string, unknown>) => !idsToDelete.includes(p.id));
      const updatedItem = await api.update(uuid, { ...item, [property]: updatedProperty });
      return HttpResponse.json(updatedItem);
    } else {
      // If no deletions specified, remove the property entirely
      const { [property]: _, ...rest } = item;
      const updatedItem = await api.update(uuid, rest);
      return HttpResponse.json(updatedItem);
    }
  }),

  /**
   * GET /api/v1/organisationGroups/:uuid/:property/gist
   */
  http.get('/api/v1/organisationGroups/:uuid/:property/gist', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid, queryParams);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (!(property in item)) {
      return HttpResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    return HttpResponse.json({ [property]: item[property] });
  }),

  /**
   * GET /api/v1/organisationGroups/:uuid/:property/gist.csv
   */
  http.get('/api/v1/organisationGroups/:uuid/:property/gist.csv', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const item = await api.find(uuid, queryParams);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (!(property in item)) {
      return HttpResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    // Here we would normally convert to CSV
    return new HttpResponse(JSON.stringify({ [property]: item[property] }), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv'
      }
    });
  }),

  /**
   * POST /api/v1/organisationGroups/:uuid/:property/:itemId
   */
  http.post('/api/v1/organisationGroups/:uuid/:property/:itemId', async ({ params, request }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property, itemId } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (!Array.isArray(item[property])) {
      return HttpResponse.json({ message: 'Property is not an array' }, { status: 400 });
    }

    // Add the new item with the specified ID to the property array
    const newPropertyItem = { id: itemId, ...data };
    const updatedProperty = [...item[property], newPropertyItem];
    const updatedItem = await api.update(uuid, { ...item, [property]: updatedProperty });
    
    return HttpResponse.json(newPropertyItem, { status: 201 });
  }),

  /**
   * DELETE /api/v1/organisationGroups/:uuid/:property/:itemId
   */
  http.delete('/api/v1/organisationGroups/:uuid/:property/:itemId', async ({ params }) => {
    const api = mockApi('organisation_groups');
    const { uuid, property, itemId } = params as Record<string, string>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (!Array.isArray(item[property])) {
      return HttpResponse.json({ message: 'Property is not an array' }, { status: 400 });
    }

    // Remove the item with the specified ID from the property array
    const updatedProperty = item[property].filter((p: Record<string, unknown>) => p.id !== itemId);
    
    if (updatedProperty.length === item[property].length) {
      return HttpResponse.json({ message: 'Item ID not found in property' }, { status: 404 });
    }
    
    const updatedItem = await api.update(uuid, { ...item, [property]: updatedProperty });
    return HttpResponse.json({ message: 'Deleted successfully' });
  })
];

export default organisationGroupsApi;