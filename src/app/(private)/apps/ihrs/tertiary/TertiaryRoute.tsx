import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import IHRSLayout from '../layout/IHRSLayout';
import ihrsLayoutSettings from '../layout/ihrsLayoutSettings';
import ihrsAuth from '@/app/(private)/apps/ihrs/layout/ihrsAuth';

const CardBasedEntrySystem = lazy(() => import('../components/CardBasedEntrySystem'));


/**
 * Getting Started Doc Routes
 */
const GeneralRoute: FuseRouteItemType = {
	path: 'apps/ihrs',
	element: <IHRSLayout />,
	settings: ihrsLayoutSettings,
	auth: ihrsAuth,
	children: [
		{
			path: 'hospital-report',
			element: <CardBasedEntrySystem />
		},
	]
};

export default GeneralRoute;
