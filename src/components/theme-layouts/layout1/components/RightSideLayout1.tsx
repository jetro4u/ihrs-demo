import { lazy, memo, Suspense } from 'react';

const QuickPanel = lazy(() => import('@/components/theme-layouts/components/quickPanel/QuickPanel'));
//const MessengerPanel = lazy(() => import('@/app/(control-panel)/apps/messenger/messengerPanel/MessengerPanel'));
const NotificationPanel = lazy(() => import('@/app/(private)/apps/notifications/NotificationPanel'));

/**
 * The right side layout 1.
 */
function RightSideLayout1() {
	return (
		<Suspense>
			<QuickPanel />
			<NotificationPanel />
		</Suspense>
	);
}

export default memo(RightSideLayout1);
