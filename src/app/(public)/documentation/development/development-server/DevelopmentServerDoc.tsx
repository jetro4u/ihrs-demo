import FuseHighlight from '@fuse/core/FuseHighlight';
import Typography from '@mui/material/Typography';

/**
 * Development Server Doc
 * This document provides information on how to run the development server.
 */
function DevelopmentServerDoc() {
	return (
		<>
			<Typography
				variant="h4"
				className="mb-10 font-bold"
			>
				Development Server
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				While still in your working directory, execute the following command in the console application:
			</Typography>

			<FuseHighlight
				component="pre"
				className="language-bash my-4"
			>
				{` npm start `}
			</FuseHighlight>

			<Typography
				className="mb-4"
				component="p"
			>
				And that's it. ViteJS will take care of everything and will initiate the Fuse React server.
			</Typography>

			<Typography
				className="mb-4"
				component="p"
			>
				You can check your console application for further information about the server. By default, it will be
				running on <b>http://localhost:3000</b> although it could change depending on your setup.
			</Typography>

			<div className="my-6 px-6 py-4 border-1 border-red-500 rounded-xl">
				<Typography className="mb-2 font-medium text-lg text-red-500">Important:</Typography>
				<Typography component="div">
					In case of runtime errors on first run, make sure you are running an LTS release of Node.js. Delete
					node_modules and try again.
				</Typography>
			</div>
		</>
	);
}

export default DevelopmentServerDoc;
