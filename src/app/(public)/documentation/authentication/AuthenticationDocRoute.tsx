import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import documentationLayoutSettings from '@/app/(public)/documentation/layout/documentationLayoutSettings';
import DocumentationLayout from '@/app/(public)/documentation/layout/DocumentationLayout';
import documentationAuth from '@/app/(public)/documentation/layout/documentationAuth';

const AuthenticationDoc = lazy(() => import('./AuthenticationDoc'));

/**
 * Authentication Doc Route
 */
const AuthenticationDocRoute: FuseRouteItemType = {
	path: 'documentation/authentication',
	element: <DocumentationLayout />,
	settings: documentationLayoutSettings,
	auth: documentationAuth,
	children: [
		{
			path: '',
			element: <AuthenticationDoc />
		}
	]
};

export default AuthenticationDocRoute;
