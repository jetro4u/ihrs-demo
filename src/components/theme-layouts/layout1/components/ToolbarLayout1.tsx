import { ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import clsx from 'clsx';
import { memo } from 'react';
import NavbarToggleButton from 'src/components/theme-layouts/components/navbar/NavbarToggleButton';
import { selectFuseNavbar } from 'src/components/theme-layouts/components/navbar/navbarSlice';
import { useAppSelector } from 'src/store/hooks';
import themeOptions from 'src/configs/themeOptions';
import _ from 'lodash';
import useFuseLayoutSettings from '@fuse/core/FuseLayout/useFuseLayoutSettings';
import { useToolbarTheme } from '@fuse/core/FuseSettings/hooks/fuseThemeHooks';
import NotificationPanelToggleButton from '@/app/(control-panel)/apps/notifications/NotificationPanelToggleButton';
import AdjustFontSize from '../../components/AdjustFontSize';
import FullScreenToggle from '../../components/FullScreenToggle';
import NavigationShortcuts from '../../components/navigation/NavigationShortcuts';
import NavigationSearch from '../../components/navigation/NavigationSearch';
import QuickPanelToggleButton from '../../components/quickPanel/QuickPanelToggleButton';
import { Layout1ConfigDefaultsType } from '@/components/theme-layouts/layout1/Layout1Config';
import useThemeMediaQuery from '../../../../@fuse/hooks/useThemeMediaQuery';
import { AppInfo } from '@/configs/defaultAppsInfo';
import Apps from '../../components/Apps';
import UserMenu from '../../components/UserMenu';

type ToolbarLayout1Props = {
	className?: string;
	appsInfo?: AppInfo[];
	currentApp?: AppInfo;
};

/**
 * The toolbar layout 1.
 */
function ToolbarLayout1(props: ToolbarLayout1Props) {
	const { className, appsInfo, currentApp } = props;
	  console.log('ToolbarLayout1 appsInfo', appsInfo)
	  console.log('ToolbarLayout1 currentApp', currentApp)

	const settings = useFuseLayoutSettings();
	const config = settings.config as Layout1ConfigDefaultsType;
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const navbar = useAppSelector(selectFuseNavbar);
	const toolbarTheme = useToolbarTheme();

	return (
		<ThemeProvider theme={toolbarTheme}>
			<AppBar
				id="fuse-toolbar"
				className={clsx('relative z-20 flex border-b', className)}
				color="default"
				sx={(theme) => ({
					backgroundColor: toolbarTheme.palette.background.default,
					...theme.applyStyles('light', {
						backgroundColor: toolbarTheme.palette.background.paper
					})
				})}
				position="static"
				elevation={0}
			>
				<Toolbar className="min-h-12 p-0 md:min-h-16">
					<div className="flex flex-1 px-2 md:px-4 space-x-2 ">
						{config.navbar.display && config.navbar.position === 'left' && (
							<>
								{!isMobile && (
									<>
										{(config.navbar.style === 'style-3' ||
											config.navbar.style === 'style-3-dense') && (
											<NavbarToggleButton className="h-10 w-10 p-0" />
										)}

										{config.navbar.style === 'style-1' && !navbar.open && (
											<NavbarToggleButton className="h-10 w-10 p-0" />
										)}
									</>
								)}

								{isMobile && <NavbarToggleButton className="h-10 w-10 p-0 sm:mx-2" />}
							</>
						)}

						{!isMobile && <NavigationShortcuts />}
					</div>

					<div className="flex items-center overflow-x-auto px-2 md:px-4 space-x-1.5">
						<AdjustFontSize />
						<FullScreenToggle />
						<NavigationSearch />
						<QuickPanelToggleButton />
						<NotificationPanelToggleButton />
						<Apps appsInfo={appsInfo} />
						{!isMobile && (
							<UserMenu
								className="border border-solid"
								arrowIcon="heroicons-outline:chevron-down"
								popoverProps={{
									anchorOrigin: {
										vertical: 'bottom',
										horizontal: 'center'
									},
									transformOrigin: {
										vertical: 'top',
										horizontal: 'center'
									}
								}}
							/>
						)}
					</div>

					{config.navbar.display && config.navbar.position === 'right' && (
						<>
							{!isMobile && (
								<>
									{(config.navbar.style === 'style-3' || config.navbar.style === 'style-3-dense') && (
										<NavbarToggleButton className="h-10 w-10 p-0" />
									)}

									{config.navbar.style === 'style-1' && !navbar.open && (
										<NavbarToggleButton className="h-10 w-10 p-0" />
									)}
								</>
							)}

							{isMobile && <NavbarToggleButton className="h-10 w-10 p-0 sm:mx-2" />}
						</>
					)}
				</Toolbar>
			</AppBar>
		</ThemeProvider>
	);
}

export default memo(ToolbarLayout1);
