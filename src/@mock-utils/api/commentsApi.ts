import { http, HttpResponse } from 'msw';
import mockApi from '../mockApi';

// Handler to add tenant header to response if missing from request
const withTenantHeader = async (request: Request) => {
	const tenantId = request.headers.get('X-Tenant-ID');
	const headers = new Headers();
	
	if (!tenantId) {
		return { headers, status: 400, body: { 
			code: 'E30002',
			runtime: 'server',
			meta: {
				name: 'MissingTenantHeader',
				title: 'Missing Tenant Header',
				severity: 'error',
				status: 400,
				message: 'The X-Tenant-ID header is required.',
				description: 'All API requests must include a valid tenant identifier.',
				fix: 'Add the X-Tenant-ID header to your request.',
				category: 'validation'
			},
			context: {}
		}};
	}
	
	return { headers, status: 200 };
};

const commentsApi = [
	/**
	 * GET api/v1/comments/dashboards/:dashboardUuid
	 */
	http.get('/api/v1/comments/dashboards/:dashboardUuid', async ({ request, params }) => {
		const { status, headers, body } = await withTenantHeader(request);
		if (status !== 200) {
			return HttpResponse.json(body, { status, headers });
		}
		
		const api = mockApi('comments');
		const { dashboardUuid } = params as Record<string, string>;
		const url = new URL(request.url);
		
		// Extract pagination and filtering params
		const page = url.searchParams.get('page') || '1';
		const per_page = url.searchParams.get('per_page') || '20';
		const sort = url.searchParams.get('sort') || 'createdAt';
		const order = url.searchParams.get('order') || 'desc';
		
		// Build filter object from query params
		const filter: Record<string, string> = {};
		url.searchParams.forEach((value, key) => {
			if (key.startsWith('filter[') && key.endsWith(']')) {
				const filterKey = key.slice(7, -1); // Extract key between 'filter[' and ']'
				filter[filterKey] = value;
			}
		});
		
		// Add dashboardUuid to filter
		filter.dashboardUuid = dashboardUuid;
		
		// Get paginated data
		const { data, total } = await api.findPaginated({
			page: parseInt(page as string),
			per_page: parseInt(per_page as string),
			filter,
			sort,
			order
		});
		
		// Calculate pagination metadata
		const currentPage = parseInt(page as string);
		const perPage = parseInt(per_page as string);
		const lastPage = Math.ceil(total / perPage);
		
		// Build HATEOAS links
		const baseUrl = `/api/v1/comments/dashboards/${dashboardUuid}`;
		const buildUrl = (p: number) => `${baseUrl}?page=${p}&per_page=${perPage}&sort=${sort}&order=${order}`;
		
		const response = {
			data,
			meta: {
				pagination: {
					total,
					per_page: perPage,
					current_page: currentPage,
					last_page: lastPage
				}
			},
			links: {
				self: buildUrl(currentPage),
				first: buildUrl(1),
				last: buildUrl(lastPage),
				next: currentPage < lastPage ? buildUrl(currentPage + 1) : null,
				prev: currentPage > 1 ? buildUrl(currentPage - 1) : null
			}
		};
		
		return HttpResponse.json(response, { headers });
	}),

	/**
	 * POST api/v1/comments/dashboards/:dashboardUuid/:dashboardTileUuid
	 */
	http.post('/api/v1/comments/dashboards/:dashboardUuid/:dashboardTileUuid', async ({ request, params }) => {
		const { status, headers, body } = await withTenantHeader(request);
		if (status !== 200) {
			return HttpResponse.json(body, { status, headers });
		}
		
		const api = mockApi('comments');
		const { dashboardUuid, dashboardTileUuid } = params as Record<string, string>;
		
		try {
			const commentData = await request.json() as Record<string, unknown>;
			
			// Add additional data
			const newComment = {
				...commentData,
				dashboardUuid,
				dashboardTileUuid,
				author: {
					id: 'current-user-id', // In a real implementation, this would come from auth
					name: 'Current User'    // In a real implementation, this would come from auth
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				status: 'active'
			};
			
			const createdComment = await api.create(newComment);
			
			return HttpResponse.json({ data: createdComment }, { status: 201, headers });
		} catch (error) {
			return HttpResponse.json({
				code: 'E30003',
				runtime: 'server',
				meta: {
					name: 'InvalidCommentData',
					title: 'Invalid Comment Data',
					severity: 'error',
					status: 400,
					message: 'The comment data provided is invalid.',
					description: 'The request body could not be processed. Make sure you provide valid comment data.',
					fix: 'Check your request body and ensure it matches the required schema.',
					category: 'validation'
				},
				context: { error }
			}, { status: 400, headers });
		}
	}),

	/**
	 * PATCH api/v1/comments/dashboards/:dashboardUuid/:commentId
	 */
	http.patch('/api/v1/comments/dashboards/:dashboardUuid/:commentId', async ({ request, params }) => {
		const { status, headers, body } = await withTenantHeader(request);
		if (status !== 200) {
			return HttpResponse.json(body, { status, headers });
		}
		
		const api = mockApi('comments');
		const { dashboardUuid, commentId } = params as Record<string, string>;
		
		try {
			const updateData = await request.json() as Record<string, unknown>;
			
			// Find the comment
			const comment = await api.find(commentId);
			
			if (!comment || comment.dashboardUuid !== dashboardUuid) {
				return HttpResponse.json({
					code: 'E30004',
					runtime: 'server',
					meta: {
						name: 'CommentNotFound',
						title: 'Comment Not Found',
						severity: 'error',
						status: 404,
						message: 'The requested comment could not be found.',
						description: 'The comment may have been deleted or you may not have permission to access it.',
						fix: 'Check the comment ID and dashboard UUID.',
						category: 'not_found'
					},
					context: { commentId, dashboardUuid }
				}, { status: 404, headers });
			}
			
			// Update the comment
			const updatedComment = await api.update(commentId, {
				...updateData,
				updatedAt: new Date().toISOString()
			});
			
			return HttpResponse.json({ data: updatedComment }, { headers });
		} catch (error) {
			return HttpResponse.json({
				code: 'E30005',
				runtime: 'server',
				meta: {
					name: 'UpdateCommentError',
					title: 'Update Comment Error',
					severity: 'error',
					status: 400,
					message: 'Failed to update the comment.',
					description: 'The request to update the comment failed.',
					fix: 'Check your request data and permissions.',
					category: 'validation'
				},
				context: { error }
			}, { status: 400, headers });
		}
	}),

	/**
	 * DELETE api/v1/comments/dashboards/:dashboardUuid/:commentId
	 */
	http.delete('/api/v1/comments/dashboards/:dashboardUuid/:commentId', async ({ request, params }) => {
		const { status, headers, body } = await withTenantHeader(request);
		if (status !== 200) {
			return HttpResponse.json(body, { status, headers });
		}
		
		const api = mockApi('comments');
		const { dashboardUuid, commentId } = params as Record<string, string>;
		
		// Find the comment
		const comment = await api.find(commentId);
		
		if (!comment || comment.dashboardUuid !== dashboardUuid) {
			return HttpResponse.json({
				code: 'E30004',
				runtime: 'server',
				meta: {
					name: 'CommentNotFound',
					title: 'Comment Not Found',
					severity: 'error',
					status: 404,
					message: 'The requested comment could not be found.',
					description: 'The comment may have been deleted or you may not have permission to access it.',
					fix: 'Check the comment ID and dashboard UUID.',
					category: 'not_found'
				},
				context: { commentId, dashboardUuid }
			}, { status: 404, headers });
		}
		
		// Delete the comment
		const result = await api.delete([commentId]);
		
		if (!result.success) {
			return HttpResponse.json({
				code: 'E30006',
				runtime: 'server',
				meta: {
					name: 'DeleteCommentError',
					title: 'Delete Comment Error',
					severity: 'error',
					status: 500,
					message: 'Failed to delete the comment.',
					description: 'The server encountered an error while attempting to delete the comment.',
					fix: 'Try again later or contact support if the issue persists.',
					category: 'unknown'
				},
				context: { commentId }
			}, { status: 500, headers });
		}
		
		return HttpResponse.json({ 
			message: 'Comment deleted successfully' 
		}, { headers });
	})
];

export default commentsApi;