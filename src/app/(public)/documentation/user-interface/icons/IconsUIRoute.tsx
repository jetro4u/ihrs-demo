import { lazy } from 'react';
import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import DocumentationLayout from '@/app/(public)/documentation/layout/DocumentationLayout';
import documentationLayoutSettings from '@/app/(public)/documentation/layout/documentationLayoutSettings';
import documentationAuth from '@/app/(public)/documentation/layout/documentationAuth';

const IconListPage = lazy(() => import('./components/IconListPage'));

/**
 * Icons UI Route
 */
const IconsUIRoute: FuseRouteItemType = {
	path: 'documentation/user-interface/icons',
	element: <DocumentationLayout />,
	settings: documentationLayoutSettings,
	auth: documentationAuth,
	children: [
		{
			path: '',
			element: <Navigate to="heroicons" />
		},
		{
			path: 'heroicons',
			children: [
				{
					path: '',
					element: <Navigate to="outline" />
				},
				{
					path: 'outline',
					element: (
						<IconListPage
							pageTitle="Heroicons Outline"
							referenceUrl="https://heroicons.com/"
							iconSet="heroicons-outline"
							apiUrl="/api/mock/ui-icons/heroicons"
						/>
					)
				},
				{
					path: 'solid',
					element: (
						<IconListPage
							pageTitle="Heroicons Solid"
							referenceUrl="https://heroicons.com/"
							iconSet="heroicons-solid"
							apiUrl="/api/mock/ui-icons/heroicons"
						/>
					)
				}
			]
		},
		{
			path: 'material',
			children: [
				{
					path: '',
					element: <Navigate to="outline" />
				},
				{
					path: 'outline',
					element: (
						<IconListPage
							pageTitle="Material Outline"
							iconSet="material-outline"
							apiUrl="/api/mock/ui-icons/material"
						/>
					)
				},
				{
					path: 'solid',
					element: (
						<IconListPage
							pageTitle="Material Solid"
							iconSet="material-solid"
							apiUrl="/api/mock/ui-icons/material"
						/>
					)
				},
				{
					path: 'twotone',
					element: (
						<IconListPage
							pageTitle="Material Twotone"
							iconSet="material-twotone"
							apiUrl="/api/mock/ui-icons/material"
						/>
					)
				}
			]
		},
		{
			path: 'feather',
			element: (
				<IconListPage
					pageTitle="Feather"
					iconSet="feather"
					apiUrl="/api/mock/ui-icons/feather"
				/>
			)
		}
	]
};

export default IconsUIRoute;
