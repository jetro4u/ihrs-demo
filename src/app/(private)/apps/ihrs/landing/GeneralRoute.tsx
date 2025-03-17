import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import { Navigate } from 'react-router';
import IHRSLayout from '../layout/IHRSLayout';
import ihrsLayoutSettings from '../layout/ihrsLayoutSettings';
import ihrsAuth from '@/app/(private)/apps/ihrs/layout/ihrsAuth';

const LandingPage = lazy(() => import('./LandingPage'));


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
			path: '',
			element: <Navigate to="home" />
		},
		{
			path: 'home',
			element: <LandingPage />
		}
	]
};

export default GeneralRoute;
