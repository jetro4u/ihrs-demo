import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import { lazy } from 'react';

const ActivitiesPage = lazy(() => import('./ActivitiesPage'));

/**
 * The Activities Page Route
 */
const ActivitiesPageRoute: FuseRouteItemType = {
	path: 'pages/activities',
	element: <ActivitiesPage />
};

export default ActivitiesPageRoute;
