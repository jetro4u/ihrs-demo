import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import { Navigate } from 'react-router';
import DocumentationLayout from '../layout/DocumentationLayout';
import documentationLayoutSettings from '../layout/documentationLayoutSettings';
import documentationAuth from '@/app/(public)/documentation/layout/documentationAuth';

const IntroductionDoc = lazy(() => import('./introduction/IntroductionDoc'));
const InstallationDoc = lazy(() => import('./installation/InstallationDoc'));
const GitRepositoryDoc = lazy(() => import('./git-repository/GitRepositoryDoc'));

/**
 * Getting Started Doc Routes
 */
const GettingStartedDocRoute: FuseRouteItemType = {
	path: 'documentation/getting-started',
	element: <DocumentationLayout />,
	settings: documentationLayoutSettings,
	auth: documentationAuth,
	children: [
		{
			path: '',
			element: <Navigate to="introduction" />
		},
		{
			path: 'introduction',
			element: <IntroductionDoc />
		},
		{
			path: 'installation',
			element: <InstallationDoc />
		},
		{
			path: 'git-repository',
			element: <GitRepositoryDoc />
		}
	]
};

export default GettingStartedDocRoute;
