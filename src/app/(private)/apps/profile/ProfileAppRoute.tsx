import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ProfileApp = lazy(() => import('./ProfileApp'));

/**
 * The Profile App Route.
 */
const ProfileAppRoute: FuseRouteItemType = {
	path: 'apps/profile',
	element: <ProfileApp />
};

export default ProfileAppRoute;
