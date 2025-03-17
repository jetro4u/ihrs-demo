import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import { Navigate } from 'react-router';
import TsFileRenamingMigrationDoc from './ts-migration/TsFileRenamingMigrationDoc';
import CodeSplittingDoc from './code-splitting/CodeSplittingDoc';
import MultiLanguageDoc from './multi-language/MultiLanguageDoc';
import documentationLayoutSettings from '@/app/(public)/documentation/layout/documentationLayoutSettings';
import DocumentationLayout from '@/app/(public)/documentation/layout/DocumentationLayout';
import ApiConfigurationDoc from './api-integration/api-configuration/ApiConfigurationDoc';
import documentationAuth from '@/app/(public)/documentation/layout/documentationAuth';

const DevelopmentServerDoc = lazy(() => import('./development-server/DevelopmentServerDoc'));
const ProductionDoc = lazy(() => import('./production/ProductionDoc'));
const DeploymentDoc = lazy(() => import('./deployment/DeploymentDoc'));
const DirectoryStructureDoc = lazy(() => import('./directory-structure/DirectoryStructureDoc'));
const UpdatingFuseReactDoc = lazy(() => import('./updating-fuse-react/UpdatingFuseReactDoc'));
const IDEsDoc = lazy(() => import('./ides-vscode-webstorm/IDEsDoc'));

/**
 * Development Doc Route
 */
const DevelopmentDocRoute: FuseRouteItemType = {
	path: 'documentation/development',
	element: <DocumentationLayout />,
	settings: documentationLayoutSettings,
	auth: documentationAuth,
	children: [
		{
			path: '',
			element: <Navigate to="development-server" />
		},
		{
			path: 'development-server',
			element: <DevelopmentServerDoc />
		},
		{
			path: 'production',
			element: <ProductionDoc />
		},
		{
			path: 'deployment',
			element: <DeploymentDoc />
		},
		{
			path: 'directory-structure',
			element: <DirectoryStructureDoc />
		},
		{
			path: 'api-integration',
			children: [
				{
					path: '',
					element: <Navigate to="api-configuration" />
				},
				{
					path: 'api-configuration',
					element: <ApiConfigurationDoc />
				}
			]
		},
		{
			path: 'code-splitting',
			element: <CodeSplittingDoc />
		},
		{
			path: 'multi-language',
			element: <MultiLanguageDoc />
		},
		{
			path: 'updating-fuse-react',
			element: <UpdatingFuseReactDoc />
		},
		{
			path: 'ts-file-rename-migration',
			element: <TsFileRenamingMigrationDoc />
		},
		{
			path: 'ides-vscode-webstorm',
			element: <IDEsDoc />
		}
	]
};

export default DevelopmentDocRoute;
