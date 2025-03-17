import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const CryptoDashboardApp = lazy(() => import('./CryptoDashboardApp'));

/**
 * Crypto Dashboard App Route
 */
const CryptoDashboardAppRoute: FuseRouteItemType = {
	path: 'dashboards/crypto',
	element: <CryptoDashboardApp />
};

export default CryptoDashboardAppRoute;
