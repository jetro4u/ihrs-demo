import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

const organisationGroupSetsApi = [
	/**
	 * GET /api/v1/organisationGroupSets
	 */
	http.get('/api/v1/organisationGroupSets', async ({ request }) => {
		const api = mockApi('organisation_group_sets');
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		const items = await api.findAll(queryParams);
		return HttpResponse.json(items);
	}),

	/**
	 * POST /api/v1/organisationGroupSets
	 */
	http.post('/api/v1/organisationGroupSets', async ({ request }) => {
		const api = mockApi('organisation_group_sets');
		const data = (await request.json()) as Record<string, unknown>;
		const newItem = await api.create(data);
		return HttpResponse.json(newItem, { status: 201 });
	}),

	/**
	 * GET /api/v1/organisationGroupSets/gist
	 */
	http.get('/api/v1/organisationGroupSets/gist', async ({ request }) => {
		const api = mockApi('organisation_group_sets');
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		const items = await api.findAll(queryParams);
		// Transform to gist format
		const gistItems = items.map(item => ({
			...item,
			displayName: item.name,
			href: `/api/v1/organisationGroupSets/${item.id}`
		}));
		return HttpResponse.json(gistItems);
	}),

	/**
	 * GET /api/v1/organisationGroupSets/gist.csv
	 */
	http.get('/api/v1/organisationGroupSets/gist.csv', async ({ request }) => {
		const api = mockApi('organisation_group_sets');
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		// Return CSV string based on the items
		return HttpResponse.text('id,name,code\n1,"Group Set 1","GS1"\n2,"Group Set 2","GS2"');
	}),

	/**
	 * PATCH /api/v1/organisationGroupSets/sharing
	 */
	http.patch('/api/v1/organisationGroupSets/sharing', async ({ request }) => {
		const data = (await request.json()) as Record<string, unknown>;
		return HttpResponse.json({ 
			status: 'OK',
			message: 'Sharing settings updated for multiple organisation group sets'
		});
	}),

	/**
	 * GET /api/v1/organisationGroupSets/:uuid
	 */
	http.get('/api/v1/organisationGroupSets/:uuid', async ({ params }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const item = await api.find(uuid);

		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}

		return HttpResponse.json(item);
	}),

	/**
	 * PUT /api/v1/organisationGroupSets/:uuid
	 */
	http.put('/api/v1/organisationGroupSets/:uuid', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const data = (await request.json()) as Record<string, unknown>;
		const updatedItem = await api.update(uuid, data);

		if (!updatedItem) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}

		return HttpResponse.json(updatedItem);
	}),

	/**
	 * PATCH /api/v1/organisationGroupSets/:uuid
	 */
	http.patch('/api/v1/organisationGroupSets/:uuid', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const operations = (await request.json()) as { op: string; path: string; value: object }[];
		
		// Apply patch operations
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Simulated patch operation (in a real implementation, this would apply all operations)
		const patchedItem = await api.update(uuid, { ...item, ...operations[0]?.value });
		return HttpResponse.json(patchedItem);
	}),

	/**
	 * DELETE /api/v1/organisationGroupSets/:uuid
	 */
	http.delete('/api/v1/organisationGroupSets/:uuid', async ({ params }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const success = await api.delete(uuid);
		
		if (!success) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		return HttpResponse.json(
			{ 
				status: 'OK',
				message: 'Organisation group set deleted successfully'
			}
		);
	}),

	/**
	 * POST /api/v1/organisationGroupSets/:uuid/favorite
	 */
	http.post('/api/v1/organisationGroupSets/:uuid/favorite', async ({ params }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Update the item to mark as favorite
		const updatedItem = await api.update(uuid, { ...item, favorite: true });
		return HttpResponse.json(updatedItem);
	}),

	/**
	 * DELETE /api/v1/organisationGroupSets/:uuid/favorite
	 */
	http.delete('/api/v1/organisationGroupSets/:uuid/favorite', async ({ params }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Update the item to remove favorite
		const updatedItem = await api.update(uuid, { ...item, favorite: false });
		return HttpResponse.json(updatedItem);
	}),

	/**
	 * GET /api/v1/organisationGroupSets/:uuid/gist
	 */
	http.get('/api/v1/organisationGroupSets/:uuid/gist', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Transform to gist format
		const gistItem = {
			...item,
			displayName: item.name,
			href: `/api/v1/organisationGroupSets/${item.id}`
		};
		
		return HttpResponse.json(gistItem);
	}),

	/**
	 * GET /api/v1/organisationGroupSets/:uuid/gist.csv
	 */
	http.get('/api/v1/organisationGroupSets/:uuid/gist.csv', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.text('No data found', { status: 404 });
		}
		
		// Return CSV string for a single item
		return HttpResponse.text(`id,name,code\n${item.id},"${item.name}","${item.code}"`);
	}),

	/**
	 * PUT /api/v1/organisationGroupSets/:uuid/sharing
	 */
	http.put('/api/v1/organisationGroupSets/:uuid/sharing', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const data = (await request.json()) as Record<string, unknown>;
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Update sharing settings for the item
		const updatedItem = await api.update(uuid, { ...item, sharing: data });
		return HttpResponse.json({
			status: 'OK',
			message: 'Sharing settings updated successfully'
		});
	}),

	/**
	 * POST /api/v1/organisationGroupSets/:uuid/subscriber
	 */
	http.post('/api/v1/organisationGroupSets/:uuid/subscriber', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const subscriberData = await request.json();
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Add subscriber logic would go here
		return HttpResponse.json({
			status: 'OK',
			message: 'Subscriber added successfully'
		}, { status: 201 });
	}),

	/**
	 * DELETE /api/v1/organisationGroupSets/:uuid/subscriber
	 */
	http.delete('/api/v1/organisationGroupSets/:uuid/subscriber', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Remove subscriber logic would go here
		return HttpResponse.json({
			status: 'OK',
			message: 'Subscriber removed successfully'
		});
	}),

	/**
	 * PUT /api/v1/organisationGroupSets/:uuid/translations
	 */
	http.put('/api/v1/organisationGroupSets/:uuid/translations', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid } = params as Record<string, string>;
		const translationsData = await request.json();
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Update translations
		const updatedItem = await api.update(uuid, { ...item, translations: translationsData });
		return HttpResponse.json(updatedItem);
	}),

	/**
	 * GET /api/v1/organisationGroupSets/:uuid/:property
	 */
	http.get('/api/v1/organisationGroupSets/:uuid/:property', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property } = params as Record<string, string>;
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Return the specific property value if it exists
		if (property in item) {
			return HttpResponse.json({ [property]: item[property as keyof typeof item] });
		} else {
			return HttpResponse.json(
				{ 
					message: `Property ${property} not found on organisation group set`,
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
	}),

	/**
	 * POST /api/v1/organisationGroupSets/:uuid/:property
	 */
	http.post('/api/v1/organisationGroupSets/:uuid/:property', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property } = params as Record<string, string>;
		const { additions, deletions, identifiableObjects } = await request.json() as {
			additions?: object[];
			deletions?: object[];
			identifiableObjects?: object[];
		};
		
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Property update logic would go here, simulating adding to an array property
		const propertyValue = Array.isArray(item[property as keyof typeof item]) 
			? [...(item[property as keyof typeof item] as []), ...(additions || [])]
			: additions;
		
		const updatedItem = await api.update(uuid, { ...item, [property]: propertyValue });
		return HttpResponse.json({ [property]: updatedItem[property as keyof typeof updatedItem] }, { status: 201 });
	}),

	/**
	 * PUT /api/v1/organisationGroupSets/:uuid/:property
	 */
	http.put('/api/v1/organisationGroupSets/:uuid/:property', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property } = params as Record<string, string>;
		const { additions, deletions, identifiableObjects } = await request.json() as {
			additions?: object[];
			deletions?: object[];
			identifiableObjects?: object[];
		};
		
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Replace property logic would go here
		const updatedItem = await api.update(uuid, { ...item, [property]: identifiableObjects || additions });
		return HttpResponse.json({ [property]: updatedItem[property as keyof typeof updatedItem] });
	}),

	/**
	 * PATCH /api/v1/organisationGroupSets/:uuid/:property
	 */
	http.patch('/api/v1/organisationGroupSets/:uuid/:property', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property } = params as Record<string, string>;
		const patchData = await request.json();
		
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Patch property logic would go here
		const updatedItem = await api.update(uuid, { ...item, [property]: patchData });
		return HttpResponse.json({ [property]: updatedItem[property as keyof typeof updatedItem] });
	}),

	/**
	 * DELETE /api/v1/organisationGroupSets/:uuid/:property
	 */
	http.delete('/api/v1/organisationGroupSets/:uuid/:property', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property } = params as Record<string, string>;
		const { deletions } = await request.json() as { deletions?: object[] };
		
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Delete property or items within property logic would go here
		// For simplicity, we'll just set it to an empty array if it's an array property
		const propertyValue = Array.isArray(item[property as keyof typeof item]) ? [] : null;
		const updatedItem = await api.update(uuid, { ...item, [property]: propertyValue });
		
		return HttpResponse.json({
			status: 'OK',
			message: `Property ${property} deleted successfully`
		});
	}),

	/**
	 * GET /api/v1/organisationGroupSets/:uuid/:property/gist
	 */
	http.get('/api/v1/organisationGroupSets/:uuid/:property/gist', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property } = params as Record<string, string>;
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Get property and transform to gist format if it's an array
		const propertyValue = item[property as keyof typeof item];
		
		if (Array.isArray(propertyValue)) {
			const gistItems = propertyValue.map((propItem: any, index: number) => ({
				...propItem,
				displayName: propItem.name || `Item ${index + 1}`,
				href: `/api/v1/organisationGroupSets/${item.id}/${property}/${propItem.id || index}`
			}));
			return HttpResponse.json(gistItems);
		} else {
			return HttpResponse.json(
				{ 
					message: `Property ${property} is not an array or not found`,
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
	}),

	/**
	 * GET /api/v1/organisationGroupSets/:uuid/:property/gist.csv
	 */
	http.get('/api/v1/organisationGroupSets/:uuid/:property/gist.csv', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property } = params as Record<string, string>;
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.text('No data found', { status: 404 });
		}
		
		// Get property and return as CSV if it's an array
		const propertyValue = item[property as keyof typeof item];
		
		if (Array.isArray(propertyValue) && propertyValue.length > 0) {
			// Basic CSV generation for array of objects - more complex implementation would vary based on property
			const headers = Object.keys(propertyValue[0]).join(',');
			const rows = propertyValue.map((row: any) => 
				Object.values(row).map(val => typeof val === 'string' ? `"${val}"` : val).join(',')
			).join('\n');
			
			return HttpResponse.text(`${headers}\n${rows}`);
		} else {
			return HttpResponse.text('No data found for property', { status: 404 });
		}
	}),

	/**
	 * POST /api/v1/organisationGroupSets/:uuid/:property/:itemId
	 */
	http.post('/api/v1/organisationGroupSets/:uuid/:property/:itemId', async ({ params, request }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property, itemId } = params as Record<string, string>;
		const itemData = await request.json();
		
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Add specific item to property array logic
		const propertyValue = Array.isArray(item[property as keyof typeof item]) 
			? [...(item[property as keyof typeof item] as []), { id: itemId, ...itemData }]
			: [{ id: itemId, ...itemData }];
		
		const updatedItem = await api.update(uuid, { ...item, [property]: propertyValue });
		return HttpResponse.json({ id: itemId, ...itemData }, { status: 201 });
	}),

	/**
	 * DELETE /api/v1/organisationGroupSets/:uuid/:property/:itemId
	 */
	http.delete('/api/v1/organisationGroupSets/:uuid/:property/:itemId', async ({ params }) => {
		const api = mockApi('organisation_group_sets');
		const { uuid, property, itemId } = params as Record<string, string>;
		
		const item = await api.find(uuid);
		
		if (!item) {
			return HttpResponse.json(
				{ 
					message: 'Organisation group set not found',
					code: 'E40004',
					runtime: 'server',
					meta: {
						name: 'NotFoundError',
						status: 404
					}
				}, 
				{ status: 404 }
			);
		}
		
		// Remove specific item from property array logic
		const propertyArray = Array.isArray(item[property as keyof typeof item]) 
			? item[property as keyof typeof item] as any[]
			: [];
		
		const filteredArray = propertyArray.filter((propItem: any) => 
			String(propItem.id) !== String(itemId)
		);
		
		const updatedItem = await api.update(uuid, { ...item, [property]: filteredArray });
		
		return HttpResponse.json({
			status: 'OK',
			message: `Item ${itemId} removed from property ${property} successfully`
		});
	})
];

export default organisationGroupSetsApi;