import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import IHRSLayout from './layout/IHRSLayout';
import ihrsLayoutSettings from '@/app/(private)/apps/ihrs/layout/ihrsLayoutSettings';

/**
 * IHRS Route
 */
const IHRSRoute: FuseRouteItemType = {
	path: 'apps/ihrs',
	auth: null,
	element: <IHRSLayout />,
	settings: ihrsLayoutSettings,
	children: [
		{
			path: '',
			element: <Navigate to="home" />
		}
	]
};

export default IHRSRoute;
