import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import { Navigate } from 'react-router';
import documentationLayoutSettings from '@/app/(public)/documentation/layout/documentationLayoutSettings';
import DocumentationLayout from '@/app/(public)/documentation/layout/DocumentationLayout';
import documentationAuth from '@/app/(public)/documentation/layout/documentationAuth';

const SettingsDoc = lazy(() => import('./settings/SettingsDoc'));
const RoutingDoc = lazy(() => import('./routing/RoutingDoc'));
const NavigationDoc = lazy(() => import('./navigation/NavigationDoc'));

/**
 * Configuration Doc Route
 */
const ConfigurationDocRoute: FuseRouteItemType = {
	path: 'documentation/configuration',
	element: <DocumentationLayout />,
	settings: documentationLayoutSettings,
	auth: documentationAuth,
	children: [
		{
			path: '',
			element: <Navigate to="settings" />
		},
		{
			path: 'settings',
			element: <SettingsDoc />
		},
		{
			path: 'routing',
			element: <RoutingDoc />
		},
		{
			path: 'navigation',
			element: <NavigationDoc />
		}
	]
};

export default ConfigurationDocRoute;
