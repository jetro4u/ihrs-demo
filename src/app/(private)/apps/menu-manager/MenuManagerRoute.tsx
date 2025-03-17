import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const MenuManager = lazy(() => import('./MenuManager'));

const MenuManagerRoute: FuseRouteItemType = {
    path: 'apps',
    element: <MenuManager />
};

export default MenuManagerRoute;