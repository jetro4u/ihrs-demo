import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const MaintenancePage = lazy(() => import('./MaintenancePage'));

/**
 * Maintenance Page Route
 */
const MaintenancePageRoute: FuseRouteItemType = {
	path: 'pages/maintenance',
	element: <MaintenancePage />
};

export default MaintenancePageRoute;
