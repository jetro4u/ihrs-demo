import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import IHRSLayout from '../layout/IHRSLayout';
import ihrsLayoutSettings from '../layout/ihrsLayoutSettings';
import ihrsAuth from '@/app/(private)/apps/ihrs/layout/ihrsAuth';

const ObjectFormBlockReportLandingPage = lazy(() => import('../components/ObjectFormBlockReportLandingPage'));
const MenuValueReportLandingPage = lazy(() => import('../components/MenuValueReportLandingPage'));
const HospitalReportLandingPage = lazy(() => import('./HospitalReportLandingPage'));

/**
 * Getting Started Doc Routes
 */
const SecondaryRoute: FuseRouteItemType = {
	path: 'apps/ihrs',
	element: <IHRSLayout />,
	settings: ihrsLayoutSettings,
	auth: ihrsAuth,
	children: [
		{
			path: 'hospital-report',
			element: <HospitalReportLandingPage />
		},
		{
			path: 'laboratory-report',
			element: <ObjectFormBlockReportLandingPage title='Laboratory Report' category='Laboratory' dataSetUid='oL88rT7STDs' />
		},
		{
			path: 'radiology-report',
			element: <ObjectFormBlockReportLandingPage title='Radiology Report' category='Radiology' dataSetUid='ukWqMLZIZIN' />
		},
		{
			path: 'optician-report',
			element: <ObjectFormBlockReportLandingPage title='Optician Report' category='Optician' dataSetUid='sNFzrpcIbDk' />
		},
		{
			path: 'dermatology-report',
			element: <ObjectFormBlockReportLandingPage title='Dermatology Report' category='Dermatology' dataSetUid='' />
		},
		{
			path: 'dental-report',
			element: <ObjectFormBlockReportLandingPage title='Dental Report' category='Dental' dataSetUid='' />
		},
		{
			path: 'opthalmology-report',
			element: <ObjectFormBlockReportLandingPage title='Olphalmology Report' category='Olphalmology' dataSetUid='u4vRGENdIQv' />
		},
		{
			path: 'surgical-services-report',
			element: <MenuValueReportLandingPage title='Surgical Services Report' category='Surgical Services' />
		},
		{
			path: 'specialist-services-report',
			element: <MenuValueReportLandingPage title='Specialist Services Report' category='Specialist Services' />
		}
	]
};

export default SecondaryRoute;
