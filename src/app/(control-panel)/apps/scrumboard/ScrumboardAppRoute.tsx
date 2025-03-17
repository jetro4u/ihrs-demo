import { lazy } from 'react';
import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ScrumboardApp = lazy(() => import('./ScrumboardApp'));
const Board = lazy(() => import('./boards/board/Board'));
const Boards = lazy(() => import('./boards/Boards'));

/**
 * The Scrumboard App Route
 */
const ScrumboardAppRoute: FuseRouteItemType = {
	path: 'apps/scrumboard',
	element: <ScrumboardApp />,
	children: [
		{
			path: '',
			element: <Navigate to="/apps/scrumboard/boards" />
		},
		{
			path: 'boards',
			children: [
				{
					path: '',
					element: <Boards />
				},
				{
					path: ':boardId',
					element: <Board />
				}
			]
		}
	]
};

export default ScrumboardAppRoute;
