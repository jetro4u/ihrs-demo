import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import IHRSLayout from '../layout/IHRSLayout';
import ihrsLayoutSettings from '../layout/ihrsLayoutSettings';
import ihrsAuth from '@/app/(private)/apps/ihrs/layout/ihrsAuth';

const MenuObjectReportLandingPage = lazy(() => import('../components/MenuObjectReportLandingPage'));
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
			element: <MenuObjectReportLandingPage title='Laboratory Test' category='Laboratory' />
		},
		{
			path: 'radiology-report',
			element: <MenuObjectReportLandingPage title='Radiology Test' category='Radiology' />
		},
		{
			path: 'pathology-report',
			element: <MenuValueReportLandingPage title='Pathology Test' category='Pathology' />
		},
		{
			path: 'dermatology-clinic-report',
			element: <MenuObjectReportLandingPage title='Dermatology Clinic' category='Dermatology' />
		},
		{
			path: 'dental-clinic-report',
			element: <MenuObjectReportLandingPage title='Dental Clinic' category='Dental' />
		},
		{
			path: 'opthalmology-clinic-report',
			element: <MenuObjectReportLandingPage title='Olphalmology Clinic' category='Olphalmology' />
		},
		{
			path: 'optician-clinic-report',
			element: <MenuObjectReportLandingPage title='Optician Test' category='Optician' />
		},
		{
			path: 'specialist-services',
			element: <MenuValueReportLandingPage title='Specialist Services' category='Specialist Services' />
		}
	]
};

export default SecondaryRoute;
