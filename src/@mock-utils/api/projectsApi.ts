import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

const projectsApi = [
  /**
   * GET api/v1/projects
   */
  http.get('/api/v1/projects', async ({ request }) => {
    const api = mockApi('projects');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    return HttpResponse.json(items);
  }),

  /**
   * GET api/v1/projects/:projectUuid
   */
  http.get('/api/v1/projects/:projectUuid', async ({ params }) => {
    const api = mockApi('projects');
    const { projectUuid } = params as Record<string, string>;
    const item = await api.find(projectUuid);

    if (!item) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  /**
   * GET api/v1/projects/:projectUuid/explores
   */
  http.get('/api/v1/projects/:projectUuid/explores', async ({ params }) => {
    const api = mockApi('explores');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * PUT api/v1/projects/:projectUuid/explores
   */
  http.put('/api/v1/projects/:projectUuid/explores', async ({ params, request }) => {
    const api = mockApi('explores');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as any[];
    
    const result = await api.updateMany(data.map(item => ({ ...item, projectUuid })));
    return HttpResponse.json(result);
  }),

  /**
   * GET api/v1/projects/:projectUuid/explores/:exploreId
   */
  http.get('/api/v1/projects/:projectUuid/explores/:exploreId', async ({ params }) => {
    const api = mockApi('explores');
    const { projectUuid, exploreId } = params as Record<string, string>;
    const item = await api.find(exploreId, { projectUuid });

    if (!item) {
      return HttpResponse.json({ message: 'Explore not found' }, { status: 404 });
    }

    return HttpResponse.json({
      results: item,
      status: 'ok'
    });
  }),

  /**
   * POST api/v1/projects/:projectUuid/explores/:exploreId/compileQuery
   */
  http.post('/api/v1/projects/:projectUuid/explores/:exploreId/compileQuery', async ({ params, request }) => {
    const api = mockApi('queries');
    const { projectUuid, exploreId } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const result = await api.create({ ...data, projectUuid, exploreId });
    return HttpResponse.json(result);
  }),

  /**
   * POST api/v1/projects/:projectUuid/explores/:exploreId/downloadCsv
   */
  http.post('/api/v1/projects/:projectUuid/explores/:exploreId/downloadCsv', async ({ params, request }) => {
    const api = mockApi('csv_downloads');
    const { projectUuid, exploreId } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const result = await api.create({ ...data, projectUuid, exploreId });
    return HttpResponse.json(result);
  }),

  /**
   * GET api/v1/projects/:projectUuid/charts
   */
  http.get('/api/v1/projects/:projectUuid/charts', async ({ params }) => {
    const api = mockApi('charts');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * GET api/v1/projects/:projectUuid/spaces
   */
  http.get('/api/v1/projects/:projectUuid/spaces', async ({ params }) => {
    const api = mockApi('spaces');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * GET api/v1/projects/:projectUuid/access
   */
  http.get('/api/v1/projects/:projectUuid/access', async ({ params }) => {
    const api = mockApi('project_access');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * POST api/v1/projects/:projectUuid/access
   */
  http.post('/api/v1/projects/:projectUuid/access', async ({ params, request }) => {
    const api = mockApi('project_access');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const result = await api.create({ ...data, projectUuid });
    return HttpResponse.json(result, { status: 201 });
  }),

  /**
   * GET api/v1/projects/:projectUuid/user/:userUuid
   */
  http.get('/api/v1/projects/:projectUuid/user/:userUuid', async ({ params }) => {
    const api = mockApi('project_members');
    const { projectUuid, userUuid } = params as Record<string, string>;
    const item = await api.find(userUuid, { projectUuid });

    if (!item) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return HttpResponse.json({
      results: item,
      status: 'ok'
    });
  }),

  /**
   * PATCH api/v1/projects/:projectUuid/access/:userUuid
   */
  http.patch('/api/v1/projects/:projectUuid/access/:userUuid', async ({ params, request }) => {
    const api = mockApi('project_access');
    const { projectUuid, userUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const updatedItem = await api.update(userUuid, { ...data, projectUuid });

    if (!updatedItem) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * DELETE api/v1/projects/:projectUuid/access/:userUuid
   */
  http.delete('/api/v1/projects/:projectUuid/access/:userUuid', async ({ params }) => {
    const api = mockApi('project_access');
    const { projectUuid, userUuid } = params as Record<string, string>;
    const result = await api.delete([userUuid], { projectUuid });

    if (!result.success) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Access revoked successfully' });
  }),

  /**
   * GET api/v1/projects/:projectUuid/groupAccesses
   */
  http.get('/api/v1/projects/:projectUuid/groupAccesses', async ({ params }) => {
    const api = mockApi('group_accesses');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * POST api/v1/projects/:projectUuid/sqlQuery
   */
  http.post('/api/v1/projects/:projectUuid/sqlQuery', async ({ params, request }) => {
    const api = mockApi('sql_queries');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const result = await api.create({ ...data, projectUuid });
    return HttpResponse.json(result);
  }),

  /**
   * POST api/v1/projects/:projectUuid/calculate-total
   */
  http.post('/api/v1/projects/:projectUuid/calculate-total', async ({ params, request }) => {
    const api = mockApi('total_calculations');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const result = await api.create({ ...data, projectUuid });
    return HttpResponse.json(result);
  }),

  /**
   * GET api/v1/projects/:projectUuid/user-credentials
   */
  http.get('/api/v1/projects/:projectUuid/user-credentials', async ({ params }) => {
    const api = mockApi('user_credentials');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    
    return HttpResponse.json({
      results: items.length > 0 ? items[0] : null,
      status: 'ok'
    });
  }),

  /**
   * PATCH api/v1/projects/:projectUuid/user-credentials/:userWarehouseCredentialsUuid
   */
  http.patch('/api/v1/projects/:projectUuid/user-credentials/:userWarehouseCredentialsUuid', async ({ params, request }) => {
    const api = mockApi('user_credentials');
    const { projectUuid, userWarehouseCredentialsUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const updatedItem = await api.update(userWarehouseCredentialsUuid, { ...data, projectUuid });

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Credentials not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * GET api/v1/projects/:projectUuid/custom-metrics
   */
  http.get('/api/v1/projects/:projectUuid/custom-metrics', async ({ params }) => {
    const api = mockApi('custom_metrics');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * PATCH api/v1/projects/:projectUuid/metadata
   */
  http.patch('/api/v1/projects/:projectUuid/metadata', async ({ params, request }) => {
    const api = mockApi('projects');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const updatedItem = await api.update(projectUuid, { metadata: data });

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * PATCH api/v1/projects/:projectUuid/semantic-layer-connection
   */
  http.patch('/api/v1/projects/:projectUuid/semantic-layer-connection', async ({ params, request }) => {
    const api = mockApi('projects');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const updatedItem = await api.update(projectUuid, { semanticLayerConnection: data });

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * DELETE api/v1/projects/:projectUuid/semantic-layer-connection
   */
  http.delete('/api/v1/projects/:projectUuid/semantic-layer-connection', async ({ params }) => {
    const api = mockApi('projects');
    const { projectUuid } = params as Record<string, string>;
    
    const updatedItem = await api.update(projectUuid, { semanticLayerConnection: null });

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Semantic layer connection deleted successfully' });
  }),

  /**
   * GET api/v1/projects/:projectUuid/dashboards
   */
  http.get('/api/v1/projects/:projectUuid/dashboards', async ({ params }) => {
    const api = mockApi('dashboards');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * POST api/v1/projects/:projectUuid/dashboards
   */
  http.post('/api/v1/projects/:projectUuid/dashboards', async ({ params, request }) => {
    const api = mockApi('dashboards');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const newItem = await api.create({ ...data, projectUuid });
    return HttpResponse.json(newItem, { status: 201 });
  }),

  /**
   * PATCH api/v1/projects/:projectUuid/dashboards
   */
  http.patch('/api/v1/projects/:projectUuid/dashboards', async ({ params, request }) => {
    const api = mockApi('dashboards');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as { uuid: string } & Record<string, unknown>;
    
    const updatedItem = await api.update(data.uuid, { ...data, projectUuid });

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Dashboard not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * POST api/v1/projects/:projectUuid/createPreview
   */
  http.post('/api/v1/projects/:projectUuid/createPreview', async ({ params, request }) => {
    const api = mockApi('project_previews');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const newItem = await api.create({ ...data, projectUuid });
    return HttpResponse.json(newItem, { status: 201 });
  }),

  /**
   * PATCH api/v1/projects/:projectUuid/schedulerSettings
   */
  http.patch('/api/v1/projects/:projectUuid/schedulerSettings', async ({ params, request }) => {
    const api = mockApi('projects');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const updatedItem = await api.update(projectUuid, { schedulerSettings: data });

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * POST api/v1/projects/:projectUuid/tags
   */
  http.post('/api/v1/projects/:projectUuid/tags', async ({ params, request }) => {
    const api = mockApi('tags');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const newItem = await api.create({ ...data, projectUuid });
    return HttpResponse.json(newItem, { status: 201 });
  }),

  /**
   * GET api/v1/projects/:projectUuid/tags
   */
  http.get('/api/v1/projects/:projectUuid/tags', async ({ params }) => {
    const api = mockApi('tags');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * DELETE api/v1/projects/:projectUuid/tags/:tagUuid
   */
  http.delete('/api/v1/projects/:projectUuid/tags/:tagUuid', async ({ params }) => {
    const api = mockApi('tags');
    const { tagUuid } = params as Record<string, string>;
    const result = await api.delete([tagUuid]);

    if (!result.success) {
      return HttpResponse.json({ message: 'Tag not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Tag deleted successfully' });
  }),

  /**
   * PATCH api/v1/projects/:projectUuid/tags/:tagUuid
   */
  http.patch('/api/v1/projects/:projectUuid/tags/:tagUuid', async ({ params, request }) => {
    const api = mockApi('tags');
    const { tagUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const updatedItem = await api.update(tagUuid, data);

    if (!updatedItem) {
      return HttpResponse.json({ message: 'Tag not found' }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * GET api/v1/projects/:projectUuid/charts/code
   */
  http.get('/api/v1/projects/:projectUuid/charts/code', async ({ params }) => {
    const api = mockApi('charts_code');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * GET api/v1/projects/:projectUuid/dashboards/code
   */
  http.get('/api/v1/projects/:projectUuid/dashboards/code', async ({ params }) => {
    const api = mockApi('dashboards_code');
    const { projectUuid } = params as Record<string, string>;
    const items = await api.findAll({ projectUuid });
    return HttpResponse.json(items);
  }),

  /**
   * POST api/v1/projects/:projectUuid/charts/:slug/code
   */
  http.post('/api/v1/projects/:projectUuid/charts/:slug/code', async ({ params, request }) => {
    const api = mockApi('charts_code');
    const { projectUuid, slug } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    // Try to find existing chart first
    const existingItem = await api.find(slug, { projectUuid });
    
    if (existingItem) {
      // Update existing chart
      const updatedItem = await api.update(slug, { ...data, projectUuid, slug });
      return HttpResponse.json(updatedItem);
    } else {
      // Create new chart
      const newItem = await api.create({ ...data, projectUuid, slug });
      return HttpResponse.json(newItem, { status: 201 });
    }
  }),

  /**
   * POST api/v1/projects/:projectUuid/dashboards/:slug/code
   */
  http.post('/api/v1/projects/:projectUuid/dashboards/:slug/code', async ({ params, request }) => {
    const api = mockApi('dashboards_code');
    const { projectUuid, slug } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    // Try to find existing dashboard first
    const existingItem = await api.find(slug, { projectUuid });
    
    if (existingItem) {
      // Update existing dashboard
      const updatedItem = await api.update(slug, { ...data, projectUuid, slug });
      return HttpResponse.json(updatedItem);
    } else {
      // Create new dashboard
      const newItem = await api.create({ ...data, projectUuid, slug });
      return HttpResponse.json(newItem, { status: 201 });
    }
  }),

  /**
   * POST api/v1/projects/:projectUuid/validate
   */
  http.post('/api/v1/projects/:projectUuid/validate', async ({ params, request }) => {
    const api = mockApi('validations');
    const { projectUuid } = params as Record<string, string>;
    const data = await request.json() as Record<string, unknown>;
    
    const result = await api.create({ ...data, projectUuid });
    return HttpResponse.json(result);
  }),

  /**
   * GET api/v1/projects/:projectUuid/validate
   */
  http.get('/api/v1/projects/:projectUuid/validate', async ({ params, request }) => {
    const api = mockApi('validations');
    const { projectUuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    
    const items = await api.findAll({ projectUuid, ...queryParams });
    return HttpResponse.json(items);
  }),

  /**
   * DELETE api/v1/projects/:projectUuid/validate/:validationId
   */
  http.delete('/api/v1/projects/:projectUuid/validate/:validationId', async ({ params }) => {
    const api = mockApi('validations');
    const { validationId } = params as Record<string, string>;
    const result = await api.delete([validationId]);

    if (!result.success) {
      return HttpResponse.json({ message: 'Validation not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Validation dismiss deleted successfully' });
  })
];

export default projectsApi;
