import { lazy } from 'react';
import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import documentationLayoutSettings from '@/app/(public)/documentation/layout/documentationLayoutSettings';
import DocumentationLayout from '@/app/(public)/documentation/layout/DocumentationLayout';
import documentationAuth from '@/app/(public)/documentation/layout/documentationAuth';

const ThemeShemesDoc = lazy(() => import('./theme-schemes/ThemeSchemesDoc'));
const ThemeLayoutsDoc = lazy(() => import('./theme-layouts/ThemeLayoutsDoc'));
const RTLSupportDoc = lazy(() => import('./rtl-support/RTLSupportDoc'));
const ChangingDefaultFontDoc = lazy(() => import('./changing-default-font/ChangingDefaultFontDoc'));
const TypographyUI = lazy(() => import('./typography/TypographyUI'));
const TailwindCssUI = lazy(() => import('./tailwindcss/TailwindCssUI'));

/**
 * User Interface Doc Routes
 */
const UserInterfaceDocRoute: FuseRouteItemType = {
	path: 'documentation/user-interface',
	element: <DocumentationLayout />,
	settings: documentationLayoutSettings,
	auth: documentationAuth,
	children: [
		{
			path: '',
			element: <Navigate to="theme-schemes" />
		},
		{
			path: 'theme-schemes',
			element: <ThemeShemesDoc />
		},
		{
			path: 'theme-layouts',
			element: <ThemeLayoutsDoc />
		},
		{
			path: 'rtl-support',
			element: <RTLSupportDoc />
		},
		{
			path: 'changing-default-font',
			element: <ChangingDefaultFontDoc />
		},
		{
			path: 'typography',
			element: <TypographyUI />
		},
		{
			path: 'tailwindcss',
			element: <TailwindCssUI />
		}
	]
};

export default UserInterfaceDocRoute;
