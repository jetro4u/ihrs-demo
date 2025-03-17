import FuseExample from '@fuse/core/FuseExample';
import FuseHighlight from '@fuse/core/FuseHighlight';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import SimpleContainerComponent from '../components/container/SimpleContainer';
import SimpleContainerRaw from '../components/container/SimpleContainer.tsx?raw';
import FixedContainerComponent from '../components/container/FixedContainer';
import FixedContainerRaw from '../components/container/FixedContainer.tsx?raw';

function ContainerDoc(props) {
	return (
		<>
			<Button
				className="normal-case absolute right-0 not-prose"
				variant="contained"
				color="secondary"
				component="a"
				href="https://mui.com/components/container"
				target="_blank"
				role="button"
				size="small"
				startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-top-right-on-square</FuseSvgIcon>}
			>
				Reference
			</Button>
			<Typography
				className="text-5xl my-4 font-bold"
				component="h1"
			>
				Container
			</Typography>
			<Typography className="description">
				The container centers your content horizontally. It's the most basic layout element.
			</Typography>

			<Typography
				className="text-base mb-8"
				component="div"
			>
				While containers can be nested, most layouts do not require a nested container.
			</Typography>
			<Typography
				className="text-3xl mt-6 mb-2.5 font-bold"
				component="h2"
			>
				Fluid
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				A fluid container width is bounded by the <code>maxWidth</code> prop value.
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				<FuseExample
					name="SimpleContainer.js"
					className="my-4"
					iframe
					component={SimpleContainerComponent}
					raw={SimpleContainerRaw}
				/>
			</Typography>

			<FuseHighlight
				component="pre"
				className="language-jsx"
			>
				{` 
<Container maxWidth="sm">
`}
			</FuseHighlight>
			<Typography
				className="text-3xl mt-6 mb-2.5 font-bold"
				component="h2"
			>
				Fixed
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				If you prefer to design for a fixed set of sizes instead of trying to accommodate a fully fluid
				viewport, you can set the <code>fixed</code> prop. The max-width matches the min-width of the current
				breakpoint.
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				<FuseExample
					name="FixedContainer.js"
					className="my-4"
					iframe
					component={FixedContainerComponent}
					raw={FixedContainerRaw}
				/>
			</Typography>

			<FuseHighlight
				component="pre"
				className="language-jsx"
			>
				{` 
<Container fixed>
`}
			</FuseHighlight>
			<Typography
				className="text-3xl mt-6 mb-2.5 font-bold"
				component="h2"
			>
				Toolpad (Beta)
			</Typography>
			<Typography
				className="text-lg mt-5 mb-2.5 font-bold"
				component="h3"
			>
				Page Container
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				The <a href="https://mui.com/toolpad/core/react-page-container/">PageContainer</a> component in{' '}
				<code>@toolpad/core</code> is the ideal wrapper for the content of your dashboard. It makes the
				Material UI Container navigation-aware and extends it with page title, breadcrumbs, actions, and more.
			</Typography>
		</>
	);
}

export default ContainerDoc;
