import FuseExample from '@fuse/core/FuseExample';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TransferListComponent from '../components/transfer-list/TransferList';
import TransferListRaw from '../components/transfer-list/TransferList.tsx?raw';
import SelectAllTransferListComponent from '../components/transfer-list/SelectAllTransferList';
import SelectAllTransferListRaw from '../components/transfer-list/SelectAllTransferList.tsx?raw';

function TransferListDoc(props) {
	return (
		<>
			<Button
				className="normal-case absolute right-0 not-prose"
				variant="contained"
				color="secondary"
				component="a"
				href="https://mui.com/components/transfer-list"
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
				Transfer List
			</Typography>
			<Typography className="description">
				A Transfer List (or "shuttle") enables the user to move one or more list items between lists.
			</Typography>

			<Typography
				className="text-3xl mt-6 mb-2.5 font-bold"
				component="h2"
			>
				Basic transfer list
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				For completeness, this example includes buttons for &quot;move all&quot;, but not every transfer list
				needs these.
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				<FuseExample
					name="TransferList.js"
					className="my-4"
					iframe={false}
					component={TransferListComponent}
					raw={TransferListRaw}
				/>
			</Typography>
			<Typography
				className="text-3xl mt-6 mb-2.5 font-bold"
				component="h2"
			>
				Enhanced transfer list
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				This example exchanges the &quot;move all&quot; buttons for a &quot;select all / select none&quot;
				checkbox and adds a counter.
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				<FuseExample
					name="SelectAllTransferList.js"
					className="my-4"
					iframe={false}
					component={SelectAllTransferListComponent}
					raw={SelectAllTransferListRaw}
				/>
			</Typography>
			<Typography
				className="text-3xl mt-6 mb-2.5 font-bold"
				component="h2"
			>
				Limitations
			</Typography>
			<Typography
				className="text-base mb-8"
				component="div"
			>
				The component comes with a couple of limitations:
			</Typography>
			<ul className="space-y-4">
				<li>
					It only works on desktop. If you have a limited amount of options to select, prefer the{' '}
					<a href="/material-ui/react-autocomplete/#multiple-values">Autocomplete</a> component. If mobile
					support is important for you, have a look at{' '}
					<a href="https://github.com/mui/material-ui/issues/27579">#27579</a>.
				</li>
				<li>
					There are no high-level components exported from npm. The demos are based on composition. If this is
					important for you, have a look at{' '}
					<a href="https://github.com/mui/material-ui/issues/27579">#27579</a>.
				</li>
			</ul>
		</>
	);
}

export default TransferListDoc;
