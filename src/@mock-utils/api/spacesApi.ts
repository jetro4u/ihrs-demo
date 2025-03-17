import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

const spacesApi = [
	/**
	 * GET /api/v1/projects/:projectUuid/spaces
	 */
	http.get('/api/v1/projects/:projectUuid/spaces', async ({ request, params }) => {
		const api = mockApi('spaces');
		const { projectUuid } = params as Record<string, string>;
		const queryParams = Object.fromEntries(new URL(request.url).searchParams);
		
		// Filter spaces by projectUuid
		const spaces = await api.findAll({ ...queryParams, projectUuid });
		
		return HttpResponse.json({
			results: spaces,
			status: 'ok'
		});
	}),

	/**
	 * POST /api/v1/projects/:projectUuid/spaces
	 */
	http.post('/api/v1/projects/:projectUuid/spaces', async ({ request, params }) => {
		const api = mockApi('spaces');
		const { projectUuid } = params as Record<string, string>;
		const data = await request.json() as CreateSpaceProps;
		
		// Include projectUuid from the URL in the space data
		const spaceData = {
			...data,
			projectUuid,
			uuid: crypto.randomUUID(),
			organizationUuid: 'org-uuid-placeholder',
			slug: data.name.toLowerCase().replace(/\s+/g, '-'),
			dashboards: [],
			queries: []
		};
		
		const newSpace = await api.create(spaceData);
		
		return HttpResponse.json({
			results: newSpace,
			status: 'ok'
		}, { status: 201 });
	}),

	/**
	 * GET /api/v1/projects/:projectUuid/spaces/:spaceUuid
	 */
	http.get('/api/v1/projects/:projectUuid/spaces/:spaceUuid', async ({ params }) => {
		const api = mockApi('spaces');
		const { spaceUuid } = params as Record<string, string>;
		const space = await api.find(spaceUuid);

		if (!space) {
			return HttpResponse.json({ 
				status: 'error',
				message: 'Space not found' 
			}, { status: 404 });
		}

		return HttpResponse.json({
			results: space,
			status: 'ok'
		});
	}),

	/**
	 * PATCH /api/v1/projects/:projectUuid/spaces/:spaceUuid
	 */
	http.patch('/api/v1/projects/:projectUuid/spaces/:spaceUuid', async ({ request, params }) => {
		const api = mockApi('spaces');
		const { spaceUuid } = params as Record<string, string>;
		const data = await request.json() as { isPrivate: boolean; name: string };
		
		const updatedSpace = await api.update(spaceUuid, data);

		if (!updatedSpace) {
			return HttpResponse.json({ 
				status: 'error',
				message: 'Space not found' 
			}, { status: 404 });
		}

		return HttpResponse.json({
			results: updatedSpace,
			status: 'ok'
		});
	}),

	/**
	 * DELETE /api/v1/projects/:projectUuid/spaces/:spaceUuid
	 */
	http.delete('/api/v1/projects/:projectUuid/spaces/:spaceUuid', async ({ params }) => {
		const api = mockApi('spaces');
		const { spaceUuid } = params as Record<string, string>;
		const result = await api.delete([spaceUuid]);

		if (!result.success) {
			return HttpResponse.json({ 
				status: 'error',
				message: 'Space not found' 
			}, { status: 404 });
		}

		return HttpResponse.json({
			status: 'ok',
			message: 'Space deleted successfully'
		});
	}),

	/**
	 * POST /api/v1/projects/:projectUuid/spaces/:spaceUuid/share
	 */
	http.post('/api/v1/projects/:projectUuid/spaces/:spaceUuid/share', async ({ request, params }) => {
		const api = mockApi('spaces');
		const { spaceUuid } = params as Record<string, string>;
		const data = await request.json() as { spaceRole: SpaceMemberRole; userUuid: string };
		
		// Get the current space
		const space = await api.find(spaceUuid);
		
		if (!space) {
			return HttpResponse.json({ 
				status: 'error',
				message: 'Space not found' 
			}, { status: 404 });
		}
		
		// Update access list
		const access = space.access || [];
		const existingUserIndex = access.findIndex(a => a.userUuid === data.userUuid);
		
		if (existingUserIndex >= 0) {
			access[existingUserIndex].role = data.spaceRole;
		} else {
			access.push({ userUuid: data.userUuid, role: data.spaceRole });
		}
		
		// Update the space
		await api.update(spaceUuid, { access });
		
		return HttpResponse.json({
			status: 'ok',
			message: 'User access added successfully'
		});
	}),
	
	/**
	 * DELETE /api/v1/projects/:projectUuid/spaces/:spaceUuid/share/:userUuid
	 */
	http.delete('/api/v1/projects/:projectUuid/spaces/:spaceUuid/share/:userUuid', async ({ params }) => {
		const api = mockApi('spaces');
		const { spaceUuid, userUuid } = params as Record<string, string>;
		
		// Get the current space
		const space = await api.find(spaceUuid);
		
		if (!space) {
			return HttpResponse.json({ 
				status: 'error',
				message: 'Space not found' 
			}, { status: 404 });
		}
		
		// Remove user from access list
		const access = space.access || [];
		const updatedAccess = access.filter(a => a.userUuid !== userUuid);
		
		// Update the space
		await api.update(spaceUuid, { access: updatedAccess });
		
		return HttpResponse.json({
			status: 'ok',
			message: 'User access revoked successfully'
		});
	}),
	
	/**
	 * POST /api/v1/projects/:projectUuid/spaces/:spaceUuid/group/share
	 */
	http.post('/api/v1/projects/:projectUuid/spaces/:spaceUuid/group/share', async ({ request, params }) => {
		const api = mockApi('spaces');
		const { spaceUuid } = params as Record<string, string>;
		const data = await request.json() as { spaceRole: SpaceMemberRole; groupUuid: string };
		
		// Get the current space
		const space = await api.find(spaceUuid);
		
		if (!space) {
			return HttpResponse.json({ 
				status: 'error',
				message: 'Space not found' 
			}, { status: 404 });
		}
		
		// Update groupsAccess list
		const groupsAccess = space.groupsAccess || [];
		const existingGroupIndex = groupsAccess.findIndex(g => g.groupUuid === data.groupUuid);
		
		if (existingGroupIndex >= 0) {
			groupsAccess[existingGroupIndex].role = data.spaceRole;
		} else {
			groupsAccess.push({ groupUuid: data.groupUuid, role: data.spaceRole });
		}
		
		// Update the space
		await api.update(spaceUuid, { groupsAccess });
		
		return HttpResponse.json({
			status: 'ok',
			message: 'Group access added successfully'
		});
	}),
	
	/**
	 * DELETE /api/v1/projects/:projectUuid/spaces/:spaceUuid/group/share/:groupUuid
	 */
	http.delete('/api/v1/projects/:projectUuid/spaces/:spaceUuid/group/share/:groupUuid', async ({ params }) => {
		const api = mockApi('spaces');
		const { spaceUuid, groupUuid } = params as Record<string, string>;
		
		// Get the current space
		const space = await api.find(spaceUuid);
		
		if (!space) {
			return HttpResponse.json({ 
				status: 'error',
				message: 'Space not found' 
			}, { status: 404 });
		}
		
		// Remove group from groupsAccess list
		const groupsAccess = space.groupsAccess || [];
		const updatedGroupsAccess = groupsAccess.filter(g => g.groupUuid !== groupUuid);
		
		// Update the space
		await api.update(spaceUuid, { groupsAccess: updatedGroupsAccess });
		
		return HttpResponse.json({
			status: 'ok',
			message: 'Group access revoked successfully'
		});
	})
];

export default spacesApi;