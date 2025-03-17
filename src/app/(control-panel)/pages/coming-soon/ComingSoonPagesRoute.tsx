import { lazy } from 'react';
import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ClassicComingSoonPage = lazy(() => import('./ClassicComingSoonPage'));
const ModernComingSoonPage = lazy(() => import('./ModernComingSoonPage'));
const ModernReversedComingSoonPage = lazy(() => import('./ModernReversedComingSoonPage'));
const SplitScreenComingSoonPage = lazy(() => import('./SplitScreenComingSoonPage'));
const SplitScreenReversedComingSoonPage = lazy(() => import('./SplitScreenReversedComingSoonPage'));
const FullScreenComingSoonPage = lazy(() => import('./FullScreenComingSoonPage'));
const FullScreenReversedComingSoonPage = lazy(() => import('./FullScreenReversedComingSoonPage'));

/**
 * ComingSoon Pages Route
 */
const ComingSoonPagesRoute: FuseRouteItemType = {
	path: 'pages/coming-soon',
	children: [
		{
			path: '',
			element: <Navigate to="classic" />
		},
		{
			path: 'classic',
			element: <ClassicComingSoonPage />
		},
		{
			path: 'modern',
			element: <ModernComingSoonPage />
		},
		{
			path: 'modern-reversed',
			element: <ModernReversedComingSoonPage />
		},
		{
			path: 'split-screen',
			element: <SplitScreenComingSoonPage />
		},
		{
			path: 'split-screen-reversed',
			element: <SplitScreenReversedComingSoonPage />
		},
		{
			path: 'full-screen',
			element: <FullScreenComingSoonPage />
		},
		{
			path: 'full-screen-reversed',
			element: <FullScreenReversedComingSoonPage />
		}
	]
};

export default ComingSoonPagesRoute;
