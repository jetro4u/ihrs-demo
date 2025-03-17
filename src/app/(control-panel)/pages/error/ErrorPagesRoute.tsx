import { lazy } from 'react';
import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Error404Page = lazy(() => import('./Error404Page'));
const Error500Page = lazy(() => import('./Error500Page'));
const Error401Page = lazy(() => import('./Error401Page'));

/**
 * The error pages config.
 */
const ErrorPagesRoute: FuseRouteItemType = {
	path: 'pages/error',
	children: [
		{
			path: '',
			element: <Navigate to="404" />
		},
		{
			path: '401',
			element: <Error401Page />
		},
		{
			path: '404',
			element: <Error404Page />
		},
		{
			path: '500',
			element: <Error500Page />
		}
	]
};

export default ErrorPagesRoute;
