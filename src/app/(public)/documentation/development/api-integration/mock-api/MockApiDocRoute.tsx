import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import documentationLayoutSettings from '@/app/(public)/documentation/layout/documentationLayoutSettings';

const MockApiDoc = lazy(() => import('./MockApiDoc'));

/**
 * Changelog Doc Route
 */
const MockApiDocRoute: FuseRouteItemType = {
	path: 'documentation/development/api-integration/mock-api',
	settings: documentationLayoutSettings,
	children: [
		{
			path: '',
			element: <MockApiDoc />
		}
	]
};

export default MockApiDocRoute;
