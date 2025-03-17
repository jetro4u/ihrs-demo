import { lazy } from 'react';
import { Navigate } from 'react-router';
import documentationLayoutSettings from '@/app/(public)/documentation/layout/documentationLayoutSettings';
import DocumentationLayout from '@/app/(public)/documentation/layout/DocumentationLayout';

const Accordion = lazy(() => import('./doc/Accordion'));
const Alert = lazy(() => import('./doc/Alert'));
const AppBar = lazy(() => import('./doc/AppBar'));
const Autocomplete = lazy(() => import('./doc/Autocomplete'));
const Avatars = lazy(() => import('./doc/Avatars'));
const Backdrop = lazy(() => import('./doc/Backdrop'));
const Badges = lazy(() => import('./doc/Badges'));
const BottomNavigation = lazy(() => import('./doc/BottomNavigation'));
const Box = lazy(() => import('./doc/Box'));
const Breadcrumbs = lazy(() => import('./doc/Breadcrumbs'));
const ButtonGroup = lazy(() => import('./doc/ButtonGroup'));
const Buttons = lazy(() => import('./doc/Buttons'));
const Cards = lazy(() => import('./doc/Cards'));
const Checkboxes = lazy(() => import('./doc/Checkboxes'));
const Chips = lazy(() => import('./doc/Chips'));
const Container = lazy(() => import('./doc/Container'));
const CssBaseline = lazy(() => import('./doc/CssBaseline'));
const Dialogs = lazy(() => import('./doc/Dialogs'));
const Dividers = lazy(() => import('./doc/Dividers'));
const Drawers = lazy(() => import('./doc/Drawers'));
const FloatingActionButton = lazy(() => import('./doc/FloatingActionButton'));
const Grid = lazy(() => import('./doc/Grid'));
const Grid2 = lazy(() => import('./doc/Grid2'));
const ImageList = lazy(() => import('./doc/ImageList'));
const Links = lazy(() => import('./doc/Links'));
const Lists = lazy(() => import('./doc/Lists'));
const Masonry = lazy(() => import('./doc/Masonry'));
const Menus = lazy(() => import('./doc/Menus'));
const Modal = lazy(() => import('./doc/Modal'));
const Pagination = lazy(() => import('./doc/Pagination'));
const Paper = lazy(() => import('./doc/Paper'));
const Popover = lazy(() => import('./doc/Popover'));
const Popper = lazy(() => import('./doc/Popper'));
const Progress = lazy(() => import('./doc/Progress'));
const RadioButtons = lazy(() => import('./doc/RadioButtons'));
const Rating = lazy(() => import('./doc/Rating'));
const Selects = lazy(() => import('./doc/Selects'));
const Skeleton = lazy(() => import('./doc/Skeleton'));
const Slider = lazy(() => import('./doc/Slider'));
const Snackbars = lazy(() => import('./doc/Snackbars'));
const SpeedDial = lazy(() => import('./doc/SpeedDial'));
const Stack = lazy(() => import('./doc/Stack'));
const Steppers = lazy(() => import('./doc/Steppers'));
const Switches = lazy(() => import('./doc/Switches'));
const Table = lazy(() => import('./doc/Table'));
const Tabs = lazy(() => import('./doc/Tabs'));
const TextFields = lazy(() => import('./doc/TextFields'));
const Timeline = lazy(() => import('./doc/Timeline'));
const ToggleButton = lazy(() => import('./doc/ToggleButton'));
const Tooltips = lazy(() => import('./doc/Tooltips'));
const TransferList = lazy(() => import('./doc/TransferList'));
const Transitions = lazy(() => import('./doc/Transitions'));
const Typography = lazy(() => import('./doc/Typography'));

const MaterialUIComponentsRoute = {
	path: 'documentation/material-ui-components',
	element: <DocumentationLayout />,
	settings: documentationLayoutSettings,
	children: [
		{
			path: '',
			element: <Navigate to="accordion" />
		},
		{ path: 'accordion', element: <Accordion /> },
		{ path: 'alert', element: <Alert /> },
		{ path: 'app-bar', element: <AppBar /> },
		{ path: 'autocomplete', element: <Autocomplete /> },
		{ path: 'avatars', element: <Avatars /> },
		{ path: 'backdrop', element: <Backdrop /> },
		{ path: 'badges', element: <Badges /> },
		{ path: 'bottom-navigation', element: <BottomNavigation /> },
		{ path: 'box', element: <Box /> },
		{ path: 'breadcrumbs', element: <Breadcrumbs /> },
		{ path: 'button-group', element: <ButtonGroup /> },
		{ path: 'buttons', element: <Buttons /> },
		{ path: 'cards', element: <Cards /> },
		{ path: 'checkboxes', element: <Checkboxes /> },
		{ path: 'chips', element: <Chips /> },
		{ path: 'container', element: <Container /> },
		{ path: 'css-baseline', element: <CssBaseline /> },
		{ path: 'dialogs', element: <Dialogs /> },
		{ path: 'dividers', element: <Dividers /> },
		{ path: 'drawers', element: <Drawers /> },
		{ path: 'floating-action-button', element: <FloatingActionButton /> },
		{ path: 'grid', element: <Grid /> },
		{ path: 'grid2', element: <Grid2 /> },
		{ path: 'image-list', element: <ImageList /> },
		{ path: 'links', element: <Links /> },
		{ path: 'lists', element: <Lists /> },
		{ path: 'masonry', element: <Masonry /> },
		{ path: 'menus', element: <Menus /> },
		{ path: 'modal', element: <Modal /> },
		{ path: 'pagination', element: <Pagination /> },
		{ path: 'paper', element: <Paper /> },
		{ path: 'popover', element: <Popover /> },
		{ path: 'popper', element: <Popper /> },
		{ path: 'progress', element: <Progress /> },
		{ path: 'radio-buttons', element: <RadioButtons /> },
		{ path: 'rating', element: <Rating /> },
		{ path: 'selects', element: <Selects /> },
		{ path: 'skeleton', element: <Skeleton /> },
		{ path: 'slider', element: <Slider /> },
		{ path: 'snackbars', element: <Snackbars /> },
		{ path: 'speed-dial', element: <SpeedDial /> },
		{ path: 'stack', element: <Stack /> },
		{ path: 'steppers', element: <Steppers /> },
		{ path: 'switches', element: <Switches /> },
		{ path: 'table', element: <Table /> },
		{ path: 'tabs', element: <Tabs /> },
		{ path: 'text-fields', element: <TextFields /> },
		{ path: 'timeline', element: <Timeline /> },
		{ path: 'toggle-button', element: <ToggleButton /> },
		{ path: 'tooltips', element: <Tooltips /> },
		{ path: 'transfer-list', element: <TransferList /> },
		{ path: 'transitions', element: <Transitions /> },
		{ path: 'typography', element: <Typography /> }
	]
};

export default MaterialUIComponentsRoute;
