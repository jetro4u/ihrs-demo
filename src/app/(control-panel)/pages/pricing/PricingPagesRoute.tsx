import { Navigate } from 'react-router';

import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import ModernPricingPage from './modern/ModernPricingPage';
import SimplePricingPage from './simple/SimplePricingPage';
import SinglePricingPage from './single/SinglePricingPage';
import TablePricingPage from './table/TablePricingPage';

/**
 * Pricing Pages Route
 */
const PricingPagesRoute: FuseRouteItemType = {
	path: 'pages/pricing',
	children: [
		{
			path: '',
			element: <Navigate to="modern" />
		},
		{
			path: 'modern',
			element: <ModernPricingPage />
		},
		{
			path: 'simple',
			element: <SimplePricingPage />
		},
		{
			path: 'single',
			element: <SinglePricingPage />
		},
		{
			path: 'table',
			element: <TablePricingPage />
		}
	]
};

export default PricingPagesRoute;
