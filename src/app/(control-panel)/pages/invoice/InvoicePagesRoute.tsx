import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import CompactInvoicePage from './printable/CompactInvoicePage';
import ModernInvoicePage from './printable/ModernInvoicePage';

/**
 * Invoice Pages Route
 */
const InvoicePagesRoute: FuseRouteItemType = {
	path: 'pages/invoice',
	children: [
		{
			path: '',
			element: <Navigate to="compact" />
		},
		{
			path: 'compact',
			element: <CompactInvoicePage />
		},
		{
			path: 'modern',
			element: <ModernInvoicePage />
		}
	]
};

export default InvoicePagesRoute;
