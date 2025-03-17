import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

const organisationsApi = [
  /**
   * GET /api/v1/organisations - List all Organizations
   */
  http.get('/api/v1/organisations', async ({ request }) => {
    const api = mockApi('organisations');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    return HttpResponse.json({
      data: items,
      meta: {
        pagination: {
          total: items.length,
          per_page: parseInt(queryParams.pageSize || '20'),
          current_page: parseInt(queryParams.page || '1'),
          last_page: Math.ceil(items.length / parseInt(queryParams.pageSize || '20'))
        }
      },
      links: {
        self: request.url,
        first: `${request.url}?page=1`,
        last: `${request.url}?page=${Math.ceil(items.length / parseInt(queryParams.pageSize || '20'))}`,
        next: parseInt(queryParams.page || '1') < Math.ceil(items.length / parseInt(queryParams.pageSize || '20')) 
          ? `${request.url}?page=${parseInt(queryParams.page || '1') + 1}` 
          : null,
        prev: parseInt(queryParams.page || '1') > 1 
          ? `${request.url}?page=${parseInt(queryParams.page || '1') - 1}` 
          : null
      }
    });
  }),

  /**
   * POST /api/v1/organisations - Create Organizations
   */
  http.post('/api/v1/organisations', async ({ request }) => {
    const api = mockApi('organisations');
    const data = (await request.json()) as Record<string, unknown>;
    const newItem = await api.create(data);
    return HttpResponse.json(newItem, { status: 201 });
  }),

  /**
   * GET /api/v1/organisations.geojson - Get OrganisationGroups.getGeoJson
   */
  http.get('/api/v1/organisations.geojson', async ({ request }) => {
    const api = mockApi('organisations');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    
    // Transform to GeoJSON format
    const geoJson = {
      type: "FeatureCollection",
      features: items.map(org => ({
        type: "Feature",
        geometry: org.geometry || null,
        properties: queryParams.properties === 'true' ? org : { id: org.id, name: org.name }
      }))
    };
    
    return HttpResponse.json(geoJson);
  }),

  /**
   * GET /api/v1/organisations/gist - Get Organisations Gist
   */
  http.get('/api/v1/organisations/gist', async ({ request }) => {
    const api = mockApi('organisations');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    
    // Transform to Gist format (simplified view)
    const gistItems = items.map(org => {
      const fields = queryParams.fields ? queryParams.fields.split(',') : ['name', 'shortName', 'code'];
      const result: Record<string, any> = {};
      
      fields.forEach(field => {
        if (field === '*') {
          Object.assign(result, org);
        } else if (org[field] !== undefined) {
          result[field] = org[field];
        }
      });
      
      return result;
    });
    
    return HttpResponse.json(gistItems);
  }),

  /**
   * GET /api/v1/organisations/gist.csv - Get Organisations Gist CSV
   */
  http.get('/api/v1/organisations/gist.csv', async ({ request }) => {
    const api = mockApi('organisations');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const items = await api.findAll(queryParams);
    
    // Transform to CSV format
    const fields = queryParams.fields ? queryParams.fields.split(',') : ['name', 'shortName', 'code'];
    const header = fields.join(',');
    const rows = items.map(org => {
      return fields.map(field => {
        const value = field === '*' ? JSON.stringify(org) : org[field];
        return value !== undefined ? `"${value}"` : '""';
      }).join(',');
    });
    
    const csv = [header, ...rows].join('\n');
    return new HttpResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=organisations.csv'
      }
    });
  }),

  /**
   * POST /api/v1/organisations/merge - Create Organisations merge
   */
  http.post('/api/v1/organisations/merge', async ({ request }) => {
    const api = mockApi('organisations');
    const data = (await request.json()) as {
      sources: string[];
      target: string;
      dataApprovalMergeStrategy: string;
      dataValueMergeStrategy: string;
      deleteSources: boolean;
    };
    
    // Merge logic
    const targetOrg = await api.find(data.target);
    if (!targetOrg) {
      return HttpResponse.json({ 
        code: 'E30002',
        runtime: 'server',
        meta: {
          name: 'TargetNotFoundError',
          title: 'Target Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Target organization not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    // Check if all sources exist
    const sourceOrgsPromises = data.sources.map(id => api.find(id));
    const sourceOrgs = await Promise.all(sourceOrgsPromises);
    if (sourceOrgs.some(org => !org)) {
      return HttpResponse.json({ 
        code: 'E30003',
        runtime: 'server',
        meta: {
          name: 'SourceNotFoundError',
          title: 'Source Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'One or more source organizations not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    // If deleteSources is true, delete source organizations
    if (data.deleteSources) {
      await api.delete(data.sources);
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Organizations merged successfully',
      target: targetOrg
    });
  }),

  /**
   * PATCH /api/v1/organisations/sharing - Modify Organisations Sharing
   */
  http.patch('/api/v1/organisations/sharing', async ({ request }) => {
    const api = mockApi('organisations');
    const data = (await request.json()) as Record<string, unknown>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    
    // Update sharing settings for multiple organizations
    const result = await api.updateMany(data);
    return HttpResponse.json(result);
  }),

  /**
   * POST /api/v1/organisations/split - Create a Organisations Split
   */
  http.post('/api/v1/organisations/split', async ({ request }) => {
    const api = mockApi('organisations');
    const data = (await request.json()) as {
      source: string;
      targets: string[];
      primaryTarget: string;
      deleteSource: boolean;
    };
    
    // Check if source exists
    const sourceOrg = await api.find(data.source);
    if (!sourceOrg) {
      return HttpResponse.json({ 
        code: 'E30004',
        runtime: 'server',
        meta: {
          name: 'SourceNotFoundError',
          title: 'Source Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Source organization not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    // Check if all targets exist
    const targetOrgsPromises = data.targets.map(id => api.find(id));
    const targetOrgs = await Promise.all(targetOrgsPromises);
    if (targetOrgs.some(org => !org)) {
      return HttpResponse.json({ 
        code: 'E30005',
        runtime: 'server',
        meta: {
          name: 'TargetNotFoundError',
          title: 'Target Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'One or more target organizations not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    // If deleteSource is true, delete source organization
    if (data.deleteSource) {
      await api.delete([data.source]);
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Organization split successfully',
      primaryTarget: targetOrgs.find(org => org.uuid === data.primaryTarget)
    });
  }),

  /**
   * GET /api/v1/organisations/{uuid} - View a Organisation
   */
  http.get('/api/v1/organisations/:uuid', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const item = await api.find(uuid);

    if (!item) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    return HttpResponse.json(item);
  }),

  /**
   * PUT /api/v1/organisations/{uuid} - Update a Organisation
   */
  http.put('/api/v1/organisations/:uuid', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    const updatedItem = await api.update(uuid, data);

    if (!updatedItem) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    return HttpResponse.json(updatedItem);
  }),

  /**
   * PATCH /api/v1/organisations/{uuid} - Modify a Organisation
   */
  http.patch('/api/v1/organisations/:uuid', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const operations = (await request.json()) as { op: string; path: string; value: unknown }[];
    
    // Get the current organization
    const currentOrg = await api.find(uuid);
    if (!currentOrg) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    // Apply JSON Patch operations
    const updatedData = { ...currentOrg };
    operations.forEach(op => {
      const pathParts = op.path.substring(1).split('/');
      let current = updatedData;
      
      // Navigate to the nested property location
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Apply the operation
      const lastPart = pathParts[pathParts.length - 1];
      switch (op.op) {
        case 'add':
        case 'replace':
          current[lastPart] = op.value;
          break;
        case 'remove':
          delete current[lastPart];
          break;
      }
    });
    
    const updatedItem = await api.update(uuid, updatedData);
    return HttpResponse.json(updatedItem);
  }),

  /**
   * DELETE /api/v1/organisations/{uuid} - Delete a Organisation
   */
  http.delete('/api/v1/organisations/:uuid', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const result = await api.delete([uuid]);

    if (!result.success) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Organization deleted successfully' });
  }),

  /**
   * POST /api/v1/organisations/{uuid}/favorite - Set as Favorite Organisation
   */
  http.post('/api/v1/organisations/:uuid/favorite', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Update organization to set as favorite
    const updatedOrg = await api.update(uuid, { favorite: true });
    return HttpResponse.json(updatedOrg);
  }),

  /**
   * DELETE /api/v1/organisations/{uuid}/favorite - Delete as Favorite Organisation
   */
  http.delete('/api/v1/organisations/:uuid/favorite', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Update organization to remove favorite
    const updatedOrg = await api.update(uuid, { favorite: false });
    return HttpResponse.json(updatedOrg);
  }),

  /**
   * GET /api/v1/organisations/{uuid}/gist - Get a Organisations Gist
   */
  http.get('/api/v1/organisations/:uuid/gist', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Create gist based on fields requested
    const fields = queryParams.fields ? queryParams.fields.split(',') : ['name', 'shortName', 'code'];
    const result: Record<string, any> = {};
    
    fields.forEach(field => {
      if (field === '*') {
        Object.assign(result, org);
      } else if (org[field] !== undefined) {
        result[field] = org[field];
      }
    });

    return HttpResponse.json(result);
  }),

  /**
   * GET /api/v1/organisations/{uuid}/gist.csv - Get a Organisations Gist CSV
   */
  http.get('/api/v1/organisations/:uuid/gist.csv', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Create CSV from organization data
    const fields = queryParams.fields ? queryParams.fields.split(',') : ['name', 'shortName', 'code'];
    const header = fields.join(',');
    const values = fields.map(field => {
      const value = field === '*' ? JSON.stringify(org) : org[field];
      return value !== undefined ? `"${value}"` : '""';
    }).join(',');
    
    const csv = [header, values].join('\n');
    return new HttpResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=organisation.csv'
      }
    });
  }),

  /**
   * GET /api/v1/organisations/{uuid}/parents - List all Organisations parents
   */
  http.get('/api/v1/organisations/:uuid/parents', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Get parent organizations
    let parents = [];
    if (org.ancestors) {
      parents = org.ancestors;
    } else if (org.parent) {
      // If only immediate parent is available
      parents = [org.parent];
    }

    // Handle translation if requested
    if (queryParams.translate === 'true' && queryParams.locale) {
      parents = parents.map(parent => {
        if (parent.translations && parent.translations.length > 0) {
          const translation = parent.translations.find(t => t.locale === queryParams.locale);
          if (translation) {
            return { ...parent, name: translation.name || parent.name };
          }
        }
        return parent;
      });
    }

    return HttpResponse.json(parents);
  }),

  /**
   * PUT /api/v1/organisations/{uuid}/sharing - Update Organisations Sharing
   */
  http.put('/api/v1/organisations/:uuid/sharing', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as { sharing: Record<string, unknown> };
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Update organization's sharing settings
    const updatedOrg = await api.update(uuid, { sharing: data.sharing });
    return HttpResponse.json(updatedOrg);
  }),

  /**
   * POST /api/v1/organisations/{uuid}/subscriber - Create Organisations Subscriber
   */
  http.post('/api/v1/organisations/:uuid/subscriber', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Add current user as subscriber
    return HttpResponse.json({ 
      success: true,
      message: 'Successfully subscribed to organization updates'
    });
  }),

  /**
   * DELETE /api/v1/organisations/{uuid}/subscriber - Delete Organisations Subscriber
   */
  http.delete('/api/v1/organisations/:uuid/subscriber', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Remove current user as subscriber
    return HttpResponse.json({ 
      success: true,
      message: 'Successfully unsubscribed from organization updates'
    });
  }),

  /**
   * PUT /api/v1/organisations/{uuid}/translations - Update a Organisations Translation
   */
  http.put('/api/v1/organisations/:uuid/translations', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const data = (await request.json()) as { translations: Array<unknown> };
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Update organization's translations
    const updatedOrg = await api.update(uuid, { translations: data.translations });
    return HttpResponse.json(updatedOrg);
  }),

  /**
   * GET /api/v1/organisations/{uuid}/{property} - View a Organisation property
   */
  http.get('/api/v1/organisations/:uuid/:property', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid, property } = params as Record<string, string>;
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    if (org[property] === undefined) {
      return HttpResponse.json({ 
        code: 'E30007',
        runtime: 'server',
        meta: {
          name: 'PropertyNotFoundError',
          title: 'Property Not Found',
          severity: 'error',
          status: 404,
          message: `Property '${property}' not found on organization.`
        },
        context: {}
      }, { status: 404 });
    }

    return HttpResponse.json(org[property]);
  }),

  /**
   * POST /api/v1/organisations/{uuid}/{property} - Create a Organisation property
   */
  http.post('/api/v1/organisations/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid, property } = params as Record<string, string>;
    const data = (await request.json()) as {
      additions: Array<unknown>;
      deletions: Array<unknown>;
      identifiableObjects: Array<unknown>;
    };
    
    const org = await api.find(uuid);
    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Update the property with new data
    const updatedProperty = Array.isArray(org[property]) 
      ? [...(org[property] || []), ...(data.additions || [])]
      : data.identifiableObjects || data.additions;
    
    const update = { [property]: updatedProperty };
    const updatedOrg = await api.update(uuid, update);
    
    return HttpResponse.json(updatedOrg[property]);
  }),

  /**
   * PUT /api/v1/organisations/{uuid}/{property} - Update a Organisation property
   */
  http.put('/api/v1/organisations/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid, property } = params as Record<string, string>;
    const data = (await request.json()) as {
      additions: Array<unknown>;
      deletions: Array<unknown>;
      identifiableObjects: Array<unknown>;
    };
    
    const org = await api.find(uuid);
    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Replace the property with new data
    const updatedProperty = data.identifiableObjects || data.additions;
    const update = { [property]: updatedProperty };
    const updatedOrg = await api.update(uuid, update);
    
    return HttpResponse.json(updatedOrg[property]);
  }),

  /**
   * PATCH /api/v1/organisations/{uuid}/{property} - Modify a Organisation property
   */
  http.patch('/api/v1/organisations/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid, property } = params as Record<string, string>;
    const data = await request.json();
    
    const org = await api.find(uuid);
    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Update the property
    const update = { [property]: data };
    const updatedOrg = await api.update(uuid, update);
    
    return HttpResponse.json(updatedOrg[property]);
  }),

  /**
   * DELETE /api/v1/organisations/{uuid}/{property} - Delete a Organisation property
   */
  http.delete('/api/v1/organisations/:uuid/:property', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid, property } = params as Record<string, string>;
    const data = (await request.json()) as {
      additions: Array<unknown>;
      deletions: Array<unknown>;
      identifiableObjects: Array<unknown>;
    };
    
    const org = await api.find(uuid);
    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // If the property is an array, remove the specified deletions
    if (Array.isArray(org[property]) && data.deletions) {
      const idsToDelete = data.deletions.map(item => item.id || item.uuid);
      const filteredArray = org[property].filter(item => !idsToDelete.includes(item.id) && !idsToDelete.includes(item.uuid));
      const update = { [property]: filteredArray };
      const updatedOrg = await api.update(uuid, update);
      return HttpResponse.json(updatedOrg[property]);
    }
    
    // If it's not an array or no deletions specified, clear the property
    const update = { [property]: null };
    const updatedOrg = await api.update(uuid, update);
    
    return HttpResponse.json({ success: true, message: `Property '${property}' deleted successfully` });
  }),

  /**
   * GET /api/v1/organisations/{uuid}/{property}/gist - Get a Organisations property Gist
   */
  http.get('/api/v1/organisations/:uuid/:property/gist', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid, property } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    if (org[property] === undefined) {
      return HttpResponse.json({ 
        code: 'E30007',
        runtime: 'server',
        meta: {
          name: 'PropertyNotFoundError',
          title: 'Property Not Found',
          severity: 'error',
          status: 404,
          message: `Property '${property}' not found on organization.`
        },
        context: {}
      }, { status: 404 });
    }

    // Transform property to Gist format
    const fields = queryParams.fields ? queryParams.fields.split(',') : ['id', 'name'];
    const result = Array.isArray(org[property]) 
      ? org[property].map(item => {
          const gistItem: Record<string, any> = {};
          fields.forEach(field => {
            if (field === '*') {
              Object.assign(gistItem, item);
            } else if (item[field] !== undefined) {
              gistItem[field] = item[field];
            }
          });
          return gistItem;
        })
      : (() => {
          const gistItem: Record<string, any> = {};
          fields.forEach(field => {
            if (field === '*') {
              Object.assign(gistItem, org[property]);
            } else if (org[property][field] !== undefined) {
              gistItem[field] = org[property][field];
            }
          });
          return gistItem;
        })();

    return HttpResponse.json(result);
  }),

  /**
   * GET /api/v1/organisations/{uuid}/{property}/gist.csv - Get a Organisations property Gist CSV
   */
  http.get('/api/v1/organisations/:uuid/:property/gist.csv', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid, property } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    if (org[property] === undefined) {
      return HttpResponse.json({ 
        code: 'E30007',
        runtime: 'server',
        meta: {
          name: 'PropertyNotFoundError',
          title: 'Property Not Found',
          severity: 'error',
          status: 404,
          message: `Property '${property}' not found on organization.`
        },
        context: {}
      }, { status: 404 });
    }

    // Generate CSV
    const fields = queryParams.fields ? queryParams.fields.split(',') : ['id', 'name'];
    let csv = '';

    if (Array.isArray(org[property])) {
      // Header row
      csv = fields.join(',') + '\n';
      
      // Data rows
      csv += org[property].map(item => {
        return fields.map(field => {
          const value = field === '*' ? JSON.stringify(item) : item[field];
          return value !== undefined ? `"${value}"` : '""';
        }).join(',');
      }).join('\n');
    } else {
      // Header row
      csv = fields.join(',') + '\n';
      
      // Single data row
      csv += fields.map(field => {
        const value = field === '*' ? JSON.stringify(org[property]) : org[property][field];
        return value !== undefined ? `"${value}"` : '""';
      }).join(',');
    }

    return new HttpResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${property}.csv`
      }
    });
  }),

  /**
   * POST /api/v1/organisations/{uuid}/{property}/{itemId} - Create a Organisation property items
   */
  http.post('/api/v1/organisations/:uuid/:property/:itemId', async ({ params, request }) => {
    const api = mockApi('organisations');
    const { uuid, property, itemId } = params as Record<string, string>;
    const data = (await request.json()) as Record<string, unknown>;
    
    const org = await api.find(uuid);
    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    if (org[property] === undefined) {
      return HttpResponse.json({ 
        code: 'E30007',
        runtime: 'server',
        meta: {
          name: 'PropertyNotFoundError',
          title: 'Property Not Found',
          severity: 'error',
          status: 404,
          message: `Property '${property}' not found on organization.`
        },
        context: {}
      }, { status: 404 });
    }

    // Add item to the property if it's an array
    if (Array.isArray(org[property])) {
      const itemWithId = { ...data, id: itemId };
      const updatedArray = [...org[property], itemWithId];
      const update = { [property]: updatedArray };
      const updatedOrg = await api.update(uuid, update);
      
      return HttpResponse.json(itemWithId, { status: 201 });
    }

    return HttpResponse.json({ 
      code: 'E30008',
      runtime: 'server',
      meta: {
        name: 'InvalidPropertyTypeError',
        title: 'Invalid Property Type',
        severity: 'error',
        status: 400,
        message: `Property '${property}' is not an array and cannot have items added to it.`
      },
      context: {}
    }, { status: 400 });
  }),

  /**
   * DELETE /api/v1/organisations/{uuid}/{property}/{itemId} - Delete a Organisation property items
   */
  http.delete('/api/v1/organisations/:uuid/:property/:itemId', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid, property, itemId } = params as Record<string, string>;
    
    const org = await api.find(uuid);
    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    if (org[property] === undefined || !Array.isArray(org[property])) {
      return HttpResponse.json({ 
        code: 'E30007',
        runtime: 'server',
        meta: {
          name: 'PropertyNotFoundError',
          title: 'Property Not Found',
          severity: 'error',
          status: 404,
          message: `Property '${property}' not found or is not an array.`
        },
        context: {}
      }, { status: 404 });
    }

    // Remove item from array
    const itemIndex = org[property].findIndex(item => item.id === itemId || item.uuid === itemId);
    if (itemIndex === -1) {
      return HttpResponse.json({ 
        code: 'E30009',
        runtime: 'server',
        meta: {
          name: 'ItemNotFoundError',
          title: 'Item Not Found',
          severity: 'error',
          status: 404,
          message: `Item with id '${itemId}' not found in property '${property}'.`
        },
        context: {}
      }, { status: 404 });
    }

    const updatedArray = [...org[property]];
    updatedArray.splice(itemIndex, 1);
    const update = { [property]: updatedArray };
    await api.update(uuid, update);
    
    return HttpResponse.json({ 
      success: true, 
      message: `Item removed from '${property}' successfully` 
    });
  }),

  /**
   * GET /api/v1/org/{uuid} - GetMyOrganization
   */
  http.get('/api/v1/org/:uuid', async ({ params }) => {
    const api = mockApi('organisations');
    const { uuid } = params as Record<string, string>;
    const org = await api.find(uuid);

    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    return HttpResponse.json(org);
  }),

  /**
   * GET /api/v1/organisations/projects - ListOrganizationProjects
   */
  http.get('/api/v1/organisations/projects', async ({ request }) => {
    const api = mockApi('projects');
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    const projects = await api.findAll(queryParams);
    
    return HttpResponse.json({
      data: projects,
      meta: {
        pagination: {
          total: projects.length,
          per_page: parseInt(queryParams.pageSize || '20'),
          current_page: parseInt(queryParams.page || '1'),
          last_page: Math.ceil(projects.length / parseInt(queryParams.pageSize || '20'))
        }
      }
    });
  }),

  /**
   * GET /api/v1/organisations/{uuid}/projects - Get a Organization Projects
   */
  http.get('/api/v1/organisations/:uuid/projects', async ({ params, request }) => {
    const api = mockApi('organisations');
    const projectsApi = mockApi('projects');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    
    const org = await api.find(uuid);
    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Filter projects by organization
    const allProjects = await projectsApi.findAll({});
    const orgProjects = allProjects.filter(project => project.organisationUuid === uuid);
    
    // Apply pagination
    const page = parseInt(queryParams.page || '1');
    const pageSize = parseInt(queryParams.pageSize || '20');
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProjects = orgProjects.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      data: paginatedProjects,
      meta: {
        pagination: {
          total: orgProjects.length,
          per_page: pageSize,
          current_page: page,
          last_page: Math.ceil(orgProjects.length / pageSize)
        }
      }
    });
  }),

  /**
   * GET /api/v1/organisations/{uuid}/users - ListOrganizationMembers
   */
  http.get('/api/v1/organisations/:uuid/users', async ({ params, request }) => {
    const api = mockApi('organisations');
    const usersApi = mockApi('users');
    const { uuid } = params as Record<string, string>;
    const queryParams = Object.fromEntries(new URL(request.url).searchParams);
    
    const org = await api.find(uuid);
    if (!org) {
      return HttpResponse.json({ 
        code: 'E30006',
        runtime: 'server',
        meta: {
          name: 'OrganizationNotFoundError',
          title: 'Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Organization not found.'
        },
        context: {}
      }, { status: 404 });
    }

    // Get all users and filter by organization
    const allUsers = await usersApi.findAll({});
    let orgUsers = allUsers.filter(user => user.organisationUuid === uuid);
    
    // Apply search filter if provided
    if (queryParams.searchQuery) {
      const searchQuery = queryParams.searchQuery.toLowerCase();
      orgUsers = orgUsers.filter(user => 
        user.name?.toLowerCase().includes(searchQuery) || 
        user.email?.toLowerCase().includes(searchQuery)
      );
    }
    
    // Filter by project if provided
    if (queryParams.projectUuid) {
      const projectsApi = mockApi('projects');
      const project = await projectsApi.find(queryParams.projectUuid);
      if (project && project.members) {
        const projectMemberIds = project.members.map(member => member.userUuid);
        orgUsers = orgUsers.filter(user => projectMemberIds.includes(user.uuid));
      }
    }
    
    // Apply pagination
    const page = parseInt(queryParams.page || '1');
    const pageSize = parseInt(queryParams.pageSize || '20');
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = orgUsers.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      data: paginatedUsers,
      meta: {
        pagination: {
          total: orgUsers.length,
          per_page: pageSize,
          current_page: page,
          last_page: Math.ceil(orgUsers.length / pageSize)
        }
      }
    });
  }),

  /**
   * GET /api/v1/organisations/users/{userUuid} - GetOrganizationMemberByUuid
   */
  http.get('/api/v1/organisations/users/:userUuid', async ({ params }) => {
    const usersApi = mockApi('users');
    const { userUuid } = params as Record<string, string>;
    
    const user = await usersApi.find(userUuid);
    if (!user) {
      return HttpResponse.json({ 
        code: 'E30010',
        runtime: 'server',
        meta: {
          name: 'UserNotFoundError',
          title: 'User Not Found',
          severity: 'error',
          status: 404,
          message: 'User not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    return HttpResponse.json(user);
  }),

  /**
   * PATCH /api/v1/organisations/users/{userUuid} - UpdateOrganizationMember
   */
  http.patch('/api/v1/organisations/users/:userUuid', async ({ params, request }) => {
    const usersApi = mockApi('users');
    const { userUuid } = params as Record<string, string>;
    const data = (await request.json()) as { role: string };
    
    // Validate role value
    const validRoles = ["member", "viewer", "interactive_viewer", "editor", "developer", "admin"];
    if (!validRoles.includes(data.role)) {
      return HttpResponse.json({ 
        code: 'E30011',
        runtime: 'server',
        meta: {
          name: 'InvalidRoleError',
          title: 'Invalid Role',
          severity: 'error',
          status: 400,
          message: 'Invalid role provided.'
        },
        context: {}
      }, { status: 400 });
    }
    
    const user = await usersApi.find(userUuid);
    if (!user) {
      return HttpResponse.json({ 
        code: 'E30010',
        runtime: 'server',
        meta: {
          name: 'UserNotFoundError',
          title: 'User Not Found',
          severity: 'error',
          status: 404,
          message: 'User not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    const updatedUser = await usersApi.update(userUuid, { role: data.role });
    return HttpResponse.json(updatedUser);
  }),

  /**
   * DELETE /api/v1/organisations/user/{userUuid} - DeleteOrganizationMember
   */
  http.delete('/api/v1/organisations/user/:userUuid', async ({ params }) => {
    const usersApi = mockApi('users');
    const { userUuid } = params as Record<string, string>;
    
    const user = await usersApi.find(userUuid);
    if (!user) {
      return HttpResponse.json({ 
        code: 'E30010',
        runtime: 'server',
        meta: {
          name: 'UserNotFoundError',
          title: 'User Not Found',
          severity: 'error',
          status: 404,
          message: 'User not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    const result = await usersApi.delete([userUuid]);
    return HttpResponse.json({ 
      success: result.success, 
      message: 'User removed from organization successfully' 
    });
  }),

  /**
   * GET /api/v1/organisations/allowedEmailDomains - ListOrganizationEmailDomains
   */
  http.get('/api/v1/organisations/allowedEmailDomains', async () => {
    const api = mockApi('organisations');
    const currentOrg = await api.findOne({ isCurrent: true });
    
    if (!currentOrg) {
      return HttpResponse.json({ 
        code: 'E30012',
        runtime: 'server',
        meta: {
          name: 'CurrentOrganizationNotFoundError',
          title: 'Current Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Current organization not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    const allowedEmailDomains = currentOrg.allowedEmailDomains || {
      role: "member",
      emailDomains: [],
      projects: []
    };
    
    return HttpResponse.json(allowedEmailDomains);
  }),

  /**
   * PATCH /api/v1/organisations/allowedEmailDomains - UpdateOrganizationEmailDomains
   */
  http.patch('/api/v1/organisations/allowedEmailDomains', async ({ request }) => {
    const api = mockApi('organisations');
    const data = (await request.json()) as {
      role: string;
      emailDomains: string[];
      projects: Array<Record<string, unknown>>;
    };
    
    // Validate role
    const validRoles = ["member", "viewer", "interactive_viewer", "editor", "developer", "admin"];
    if (data.role && !validRoles.includes(data.role)) {
      return HttpResponse.json({ 
        code: 'E30011',
        runtime: 'server',
        meta: {
          name: 'InvalidRoleError',
          title: 'Invalid Role',
          severity: 'error',
          status: 400,
          message: 'Invalid role provided.'
        },
        context: {}
      }, { status: 400 });
    }
    
    const currentOrg = await api.findOne({ isCurrent: true });
    if (!currentOrg) {
      return HttpResponse.json({ 
        code: 'E30012',
        runtime: 'server',
        meta: {
          name: 'CurrentOrganizationNotFoundError',
          title: 'Current Organization Not Found',
          severity: 'error',
          status: 404,
          message: 'Current organization not found.'
        },
        context: {}
      }, { status: 404 });
    }
    
    const updatedOrg = await api.update(currentOrg.uuid, { 
      allowedEmailDomains: {
        role: data.role,
        emailDomains: data.emailDomains,
        projects: data.projects
      }
    });
    
    return HttpResponse.json(updatedOrg.allowedEmailDomains);
  })
];

export default organisationsApi;