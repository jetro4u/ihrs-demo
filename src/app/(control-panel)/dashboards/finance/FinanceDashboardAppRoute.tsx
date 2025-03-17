import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const FinanceDashboardApp = lazy(() => import('./FinanceDashboardApp'));

/**
 * Finance Dashboard App Route
 */
const FinanceDashboardAppRoute: FuseRouteItemType = {
	path: 'dashboards/finance',
	element: <FinanceDashboardApp />
};

export default FinanceDashboardAppRoute;
