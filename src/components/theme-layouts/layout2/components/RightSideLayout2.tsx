import { lazy, memo, Suspense } from 'react';

const QuickPanel = lazy(() => import('@/components/theme-layouts/components/quickPanel/QuickPanel'));
const NotificationPanel = lazy(() => import('@/app/(private)/apps/notifications/NotificationPanel'));

/**
 * The right side layout 2.
 */
function RightSideLayout2() {
	return (
		<Suspense>
			<QuickPanel />

			<NotificationPanel />
		</Suspense>
	);
}

export default memo(RightSideLayout2);
