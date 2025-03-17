import FuseHighlight from '@fuse/core/FuseHighlight';
import Typography from '@mui/material/Typography';
import signInPageRouteRaw from '../../../sign-in/SignInPageRoute.tsx?raw';

/**
 * Routing Documentation
 *
 * This document provides detailed information on how to effectively use the routing system in Fuse React.
 * It covers modular route configuration, customization options, and automatic route management.
 */

function RoutingDoc() {
	return (
		<>
			<Typography
				variant="h4"
				className="mb-10 font-bold"
			>
				Routing Overview
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				Fuse React utilizes a custom routing system based on the popular{'  '}
				<a
					href="https://reacttraining.com/react-router/"
					target="_blank"
					rel="noopener noreferrer"
				>
					React Router v6
				</a>
				. This system is designed to support a modular, flexible approach to defining and managing routes in
				your application.
			</Typography>

			<Typography
				variant="h6"
				className="mb-3"
			>
				Dynamic Route Imports
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				All routes are automatically populated in <code>src/configs/routesConfig</code>, eliminating the need
				for manual route imports and helping maintain clean and organized routing logic.
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				You can easily customize settings or authorization for any route, ensuring that your application meets
				specific requirements.
			</Typography>

			<Typography
				variant="h6"
				className="mb-3"
			>
				Example Usage
			</Typography>
			<Typography
				className="mb-4"
				component="p"
			>
				For instance, take a look at the code in <code>SignInPageRoute.tsx</code>. This is a route configuration
				file for the sign-in page where we disable layout components like the toolbar, footer, and navbar, and
				set authorization roles to prevent logged-in users from accessing the page.
			</Typography>

			<FuseHighlight
				component="pre"
				className="language-jsx mb-6"
			>
				{signInPageRouteRaw}
			</FuseHighlight>

			<Typography
				className="mb-4"
				component="p"
			>
				In the example above, the sign-in page is configured with a simple and clear route definition. Notice
				how the <code>auth</code> property is set to <code>[]</code> to allow access for unauthenticated users,
				and the <code>layout</code> settings disable certain UI components for this route.
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				By following this modular approach, you can ensure that each route in your application is tailored to
				your specific needs, without unnecessary complexity.
			</Typography>
		</>
	);
}

export default RoutingDoc;
