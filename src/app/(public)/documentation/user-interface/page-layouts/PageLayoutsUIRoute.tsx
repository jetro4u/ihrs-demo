import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import EmptyExampleComponent from './empty/EmptyExampleComponent';
import SimpleWithSidebarsNormalScrollComponent from './simple/with-sidebars/normal-scroll/SimpleWithSidebarsNormalScrollComponent';
import SimpleWithSidebarsPageScrollComponent from './simple/with-sidebars/page-scroll/SimpleWithSidebarsPageScrollComponent';
import SimpleWithSidebarsContentScrollComponent from './simple/with-sidebars/content-scroll/SimpleWithSidebarsContentScrollComponent';
import SimpleFullWidthNormalScrollComponent from './simple/full-width/normal-scroll/SimpleFullWidthNormalScrollComponent';
import SimpleFullWidthPageScrollComponent from './simple/full-width/page-scroll/SimpleFullWidthPageScrollComponent';
import SimpleFullWidthContentScrollComponent from './simple/full-width/content-scroll/SimpleFullWidthContentScrollComponent';
import CardedFullWidthNormalScrollComponent from './carded/full-width/normal-scroll/CardedFullWidthNormalScrollComponent';
import CardedFullWidthPageScrollComponent from './carded/full-width/page-scroll/CardedFullWidthPageScrollComponent';
import CardedFullWidthContentScrollComponent from './carded/full-width/content-scroll/CardedFullWidthContentScrollComponent';
import CardedWithSidebarsNormalScrollComponent from './carded/with-sidebars/normal-scroll/CardedWithSidebarsNormalScrollComponent';
import CardedWithSidebarsPageScrollComponent from './carded/with-sidebars/page-scroll/CardedWithSidebarsPageScrollComponent';
import CardedWithSidebarsContentScrollComponent from './carded/with-sidebars/content-scroll/CardedWithSidebarsContentScrollComponent';
import overviews from './constants/overviews';
import documentationLayoutSettings from '@/app/(public)/documentation/layout/documentationLayoutSettings';
import DocumentationLayout from '@/app/(public)/documentation/layout/DocumentationLayout';
import PageLayoutOverview from './components/PageLayoutOverview';
import OverviewPageLayoutsUI from './overview/OverviewPageLayoutsUI';

/**
 * The UI configuration for the page layouts.
 */
const PageLayoutsUIRoute: FuseRouteItemType = {
	path: 'documentation/user-interface/page-layouts',
	element: <DocumentationLayout />,
	settings: documentationLayoutSettings,
	children: [
		{
			path: '',
			element: <Navigate to="overview" />
		},
		{
			path: 'overview',
			element: <OverviewPageLayoutsUI />
		},
		{
			path: 'empty',
			element: <EmptyExampleComponent />
		},
		{
			path: 'carded',
			children: [
				{
					path: 'full-width',
					children: [
						{
							path: '',
							element: <Navigate to="overview" />
						},
						{
							path: 'overview',
							element: <PageLayoutOverview layoutOptions={overviews.carded.fullWidth} />
						},
						{
							path: 'normal-scroll',
							element: <CardedFullWidthNormalScrollComponent />
						},
						{
							path: 'page-scroll',
							element: <CardedFullWidthPageScrollComponent />
						},
						{
							path: 'content-scroll',
							element: <CardedFullWidthContentScrollComponent />
						}
					]
				},
				{
					path: 'with-sidebars',
					children: [
						{
							path: '',
							element: <Navigate to="overview" />
						},
						{
							path: 'overview',
							element: <PageLayoutOverview layoutOptions={overviews.carded.withSidebars} />
						},
						{
							path: 'normal-scroll',
							element: <CardedWithSidebarsNormalScrollComponent />
						},
						{
							path: 'page-scroll',
							element: <CardedWithSidebarsPageScrollComponent />
						},
						{
							path: 'content-scroll',
							element: <CardedWithSidebarsContentScrollComponent />
						}
					]
				}
			]
		},
		{
			path: 'simple',
			children: [
				{
					path: 'full-width',
					children: [
						{
							path: '',
							element: <Navigate to="overview" />
						},
						{
							path: 'overview',
							element: <PageLayoutOverview layoutOptions={overviews.simple.fullWidth} />
						},
						{
							path: 'normal-scroll',
							element: <SimpleFullWidthNormalScrollComponent />
						},
						{
							path: 'page-scroll',
							element: <SimpleFullWidthPageScrollComponent />
						},
						{
							path: 'content-scroll',
							element: <SimpleFullWidthContentScrollComponent />
						}
					]
				},
				{
					path: 'with-sidebars',
					children: [
						{
							path: '',
							element: <Navigate to="overview" />
						},
						{
							path: 'overview',
							element: <PageLayoutOverview layoutOptions={overviews.simple.withSidebars} />
						},
						{
							path: 'normal-scroll',
							element: <SimpleWithSidebarsNormalScrollComponent />
						},
						{
							path: 'page-scroll',
							element: <SimpleWithSidebarsPageScrollComponent />
						},
						{
							path: 'content-scroll',
							element: <SimpleWithSidebarsContentScrollComponent />
						}
					]
				}
			]
		}
	]
};

export default PageLayoutsUIRoute;
