import React, { useEffect, useMemo } from 'react';
import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';
import { themeLayoutsType } from 'src/components/theme-layouts/themeLayouts';
import usePathname from '@fuse/hooks/usePathname';
import useFuseSettings from '@fuse/core/FuseSettings/hooks/useFuseSettings';
import FuseLayoutSettingsContext from './FuseLayoutSettingsContext';
import { AppInfo } from '@/configs/defaultAppsInfo';

export type FuseRouteObjectType = {
	settings?: FuseSettingsConfigType;
	auth?: string[] | [] | null | undefined;
};

export type LayoutPropsType = {
    appsInfo: AppInfo[];
    currentApp: AppInfo;
};

export type FuseLayoutProps = {
	layouts: themeLayoutsType;
	layoutProps?: LayoutPropsType;
	children?: React.ReactNode;
};

type LayoutComponentProps = {
    children?: React.ReactNode;
    layoutProps?: FuseLayoutProps["layoutProps"];
};

/**
 * FuseLayout
 * React frontend component in a React project that is used for layouting the user interface. The component
 * handles generating user interface settings related to current routes, merged with default settings, and uses
 * the new settings to generate layouts.
 */
function FuseLayout(props: FuseLayoutProps) {
	const { layouts, children, layoutProps } = props;

	const { data: current } = useFuseSettings();
	const layoutSetting = useMemo(() => current.layout, [current]);
	const layoutStyle = useMemo(() => layoutSetting.style, [layoutSetting]);
	const pathname = usePathname();

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);

	return (
		<FuseLayoutSettingsContext value={layoutSetting}>
			{useMemo(() => {
				return Object.entries(layouts).map(([key, Layout]) => {
					if (key === layoutStyle) {
						const TypedLayout = Layout as React.ComponentType<LayoutComponentProps>;
						return (
							<React.Fragment key={key}>
                				<TypedLayout layoutProps={layoutProps}>{children}</TypedLayout>
							</React.Fragment>
						);
					}

					return null;
				});
			}, [layoutStyle, layouts, children, layoutProps])}
		</FuseLayoutSettingsContext>
	);
}

export default FuseLayout;
