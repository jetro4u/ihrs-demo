import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const NotificationsApp = lazy(() => import('./NotificationsApp'));

/**
 * The Notifications App Route.
 */
const NotificationsAppRoute: FuseRouteItemType = {
	path: 'apps/notifications',
	children: [
		{
			path: '',
			element: <NotificationsApp />,
			exact: true
		}
	]
};

export default NotificationsAppRoute;
