import { validateSelfHostedTenant } from '../configs/env';

const isValidTenant = validateSelfHostedTenant();
const apiUrl = new URL((import.meta?.env?.VITE_API_BASE_URL as string) || 'http://localhost:3000');
const devApiBaseHost = apiUrl.hostname;
const PORT = Number(import.meta.env.VITE_PORT) || 3000;
const devApiBaseUrl = `${apiUrl.protocol}//${devApiBaseHost}:${PORT}`;

export const API_BASE_URL = import.meta.env.DEV ? devApiBaseUrl : (import.meta.env.VITE_API_BASE_URL as string) || '/';

// Define the types for options and configuration
type FetchOptions = RequestInit;

export class FetchApiError extends Error {
	status: number;
	data: unknown;

	constructor(status: number, data: unknown) {
		super(`FetchApiError: ${status}`);
		this.status = status;
		this.data = data;
	}
}

export class TenantAuthorizationError extends Error {
	constructor() {
		super('Tenant authorization failed: Invalid or missing tenant credentials');
		this.name = 'TenantAuthorizationError';
	}
}

// Global headers configuration
export const globalHeaders: Record<string, string> = {};

// Function to update global headers
export const setGlobalHeaders = (newHeaders: Record<string, string>) => {
	Object.assign(globalHeaders, newHeaders);
};

export const removeGlobalHeaders = (headerKeys: string[]) => {
	headerKeys.forEach((key) => {
		delete globalHeaders[key];
	});
};

// Main apiFetch function with tenant validation and interceptors
const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
	// Check for valid tenant before proceeding
	if (!isValidTenant) {
		throw new TenantAuthorizationError();
	}

	const { headers, ...restOptions } = options;
	const method = restOptions.method || 'GET';
	// Set default headers, including global headers
	const config: FetchOptions = {
		headers: {
			...(method !== 'GET' && { 'Content-Type': 'application/json' }),
			...globalHeaders,
			...headers
		},
		...restOptions
	};

	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

		if (!response.ok) {
			throw new FetchApiError(response.status, await response.json());
		}

		return response;
	} catch (error) {
		console.error('Error in apiFetch:', error);
		throw error;
	}
};

export default apiFetch;