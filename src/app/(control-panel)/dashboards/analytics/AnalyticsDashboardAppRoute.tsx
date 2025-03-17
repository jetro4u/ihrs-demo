import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const AnalyticsDashboardApp = lazy(() => import('./AnalyticsDashboardApp'));

/**
 * The Analytics Dashboard App Route
 */
const AnalyticsDashboardAppRoute: FuseRouteItemType = {
	path: 'dashboards/analytics',
	element: <AnalyticsDashboardApp />
};

export default AnalyticsDashboardAppRoute;
