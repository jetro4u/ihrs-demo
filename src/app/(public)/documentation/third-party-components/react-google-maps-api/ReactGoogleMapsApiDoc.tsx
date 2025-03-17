import FuseExample from '@fuse/core/FuseExample';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@fuse/core/Link';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import SimpleMapComponent from './examples/SimpleMap';
import SimpleMapRaw from './examples/SimpleMap.tsx?raw';

/**
 *  @react-google-maps/api Doc
 * This document provides information on how to use  @react-google-maps/api
 */
function ReactGoogleMapsApiDoc() {
	return (
		<>
			<div className="flex w-full items-center justify-between mb-6">
				<Typography variant="h4">@react-google-maps/api</Typography>
				<Button
					variant="contained"
					color="secondary"
					component="a"
					href="https://github.com/JustFly1984/react-google-maps-api"
					target="_blank"
					role="button"
					startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-top-right-on-square</FuseSvgIcon>}
					className="not-prose"
				>
					Reference
				</Button>
			</div>
			<Typography
				className="mb-4"
				component="p"
			>
				<code>react-google-maps-api</code> is a component written over a small set of the Google Maps API.
			</Typography>

			<hr />

			<Typography
				className="text-5xl mt-8 mb-2"
				component="h2"
			>
				Example Usages
			</Typography>
			<FuseExample
				className="mb-16"
				component={SimpleMapComponent}
				raw={SimpleMapRaw}
			/>

			<Typography
				className="text-5xl mt-8 mb-2"
				component="h2"
			>
				Demos
			</Typography>

			<ul>
				<li className="mb-2">
					<Link to="/dashboards/analytics">Analytics Dashboard</Link>
				</li>
			</ul>
		</>
	);
}

export default ReactGoogleMapsApiDoc;
