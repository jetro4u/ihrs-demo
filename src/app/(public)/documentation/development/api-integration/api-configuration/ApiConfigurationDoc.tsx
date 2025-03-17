import Typography from '@mui/material/Typography';
import FuseHighlight from '@fuse/core/FuseHighlight';
import TitleReferenceLink from 'src/components/TitleReferenceLink';

/**
 * Api Configuration Doc
 * This document provides information on how to configure the API using MSW and apiFetch.
 */
function ApiConfigurationDoc() {
	return (
		<>
			<Typography
				variant="h4"
				className="mb-10 font-bold"
			>
				API Configuration
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				This document explains how to configure and use API routes in the Fuse React Vite.js project with Mock
				Service Worker (MSW) and apiFetch.
			</Typography>

			<Typography
				className="mt-6 mb-2.5"
				variant="h6"
			>
				MSW Configuration <TitleReferenceLink id="msw-configuration" />
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				MSW is employed to intercept and simulate API requests during the development and testing phases. This
				approach significantly accelerates the development and testing processes of the API.
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				MSW is configured in the `index.tsx` file:
			</Typography>

			<FuseHighlight
				component="pre"
				className="language-typescript"
			>
				{`
import { worker } from '@mock-utils/mswMockAdapter';
import { API_BASE_URL } from '@/utils/apiFetch';

async function mockSetup() {
	return worker.start({
		onUnhandledRequest: 'bypass',
		serviceWorker: {
			url: \`\${API_BASE_URL}/mockServiceWorker.js\`
		}
	});
}

mockSetup().then(() => {
	// Application initialization code
});
				`}
			</FuseHighlight>

			<Typography
				className="mb-4"
				component="p"
			>
				This setup ensures that MSW intercepts API requests, and allowing mocking api requests across the
				application before bootstrapping the application.
			</Typography>

			<Typography
				className="mt-6 mb-2.5"
				variant="h6"
			>
				Global API Configuration with apiFetch <TitleReferenceLink id="api-fetch-configuration" />
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				`utils/apiFetch` is used to set global headers and the `API_BASE_URL` for all Fetch API requests. You
				can use environment variables to configure the api base URL:
			</Typography>

			<FuseHighlight
				component="pre"
				className="language-typescript"
			>
				{`
// src/utils/apiFetch.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiFetch = (url: string, options: RequestInit = {}) => {
	return fetch(\`\${API_BASE_URL}\${url}\`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});
};
				`}
			</FuseHighlight>

			<Typography
				className="mb-4"
				component="p"
			>
				Ensure you have a `.env` file in your project root with the `VITE_API_BASE_URL` variable set.
			</Typography>

			<Typography
				className="mt-6 mb-2.5"
				variant="h6"
			>
				Benefits of Using Mock Service Worker (MSW) <TitleReferenceLink id="msw-benefits" />
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				- Environment Agnostic: MSW works well in both development and production builds, making it easy to
				switch between mocked and real APIs.
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				- Easy to Use: MSW provides a simple and intuitive API for mocking API requests, making it easy to set
				up and maintain.
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				- Improved Development Workflow: With MSW, you can develop and test your application without relying on
				a real API, leading to a more efficient development process.
			</Typography>

			<Typography
				className="mt-6 mb-2.5"
				variant="h6"
			>
				Connecting to a Real Database <TitleReferenceLink id="real-database-connection" />
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				To connect these API routes to a real database in a Vite.js project, you'll typically set up a backend
				server separately. Vite focuses on the frontend, so your backend would be a separate service (e.g.,
				Express.js, NestJS, or any other backend framework).
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				In production, you would configure your Vite app to send requests to your real API endpoint by setting
				the appropriate `VITE_API_BASE_URL` in your deployment environment.
			</Typography>
		</>
	);
}

export default ApiConfigurationDoc;
