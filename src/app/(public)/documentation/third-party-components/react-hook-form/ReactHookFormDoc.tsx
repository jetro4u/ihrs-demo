import FuseExample from '@fuse/core/FuseExample';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import SimpleFormExampleRaw from './examples/SimpleFormExample.tsx?raw';
import SimpleFormExample from './examples/SimpleFormExample';

/**
 * React Hook Form Doc
 * This document provides information on how to use React Hook Form.
 */
function ReactHookFormDoc() {
	return (
		<>
			<div className="flex w-full items-center justify-between mb-6">
				<Typography variant="h4">React Hook Form</Typography>

				<Button
					variant="contained"
					color="secondary"
					component="a"
					href="http://react-hook-form.com"
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
				Performant, flexible and extensible forms with easy to use validation.
			</Typography>

			<hr />

			<Typography
				className="text-lg mt-8 mb-4"
				component="h4"
			>
				Example usage with Material-UI elements and form validation
			</Typography>

			<FuseExample
				className="mb-16"
				component={SimpleFormExample}
				raw={SimpleFormExampleRaw}
			/>

			<Typography
				className="text-5xl mt-8 mb-2"
				component="h2"
			>
				Examples
			</Typography>

			<ul>
				<li className="mb-2">@/app/(control-panel)/sign-in/SignInPage.tsx</li>
				<li className="mb-2">@/app/(control-panel)/sign-up/SignUpPage.tsx</li>
				<li className="mb-2">.</li>
				<li className="mb-2">.</li>
				<li className="mb-2">.</li>
			</ul>
		</>
	);
}

export default ReactHookFormDoc;
