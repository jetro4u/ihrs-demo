import i18next from 'i18next';
import { Navigate } from 'react-router';
import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import ar from './i18n/ar';
import en from './i18n/en';
import tr from './i18n/tr';
import SelectMailMessage from './SelectMailMessage';
import MailDetails from './mail/Mail';

const MailboxApp = lazy(() => import('./MailboxApp'));

i18next.addResourceBundle('en', 'mailboxApp', en);
i18next.addResourceBundle('tr', 'mailboxApp', tr);
i18next.addResourceBundle('ar', 'mailboxApp', ar);

/**
 * The Mailbox App Route
 */
const MailboxAppRoute: FuseRouteItemType = {
	path: '/apps/mailbox',
	children: [
		{
			path: '',
			element: <Navigate to="/apps/mailbox/folders/inbox" />
		},
		{
			path: ':category/:subCategory',
			element: <MailboxApp />,
			children: [
				{ path: '', element: <SelectMailMessage /> },
				{ path: ':mailId', element: <MailDetails /> }
			]
		}
	]
};

export default MailboxAppRoute;
