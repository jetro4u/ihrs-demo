import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';

type DemoHeaderProps = {
	leftSidebarToggle?: () => void;
	rightSidebarToggle?: () => void;
};

/**
 * The DemoHeader component.
 */
function DemoHeader(props: DemoHeaderProps) {
	const { leftSidebarToggle, rightSidebarToggle } = props;

	return (
		<div className="flex w-full p-6 space-x-3">
			{leftSidebarToggle && (
				<IconButton
					onClick={leftSidebarToggle}
					aria-label="toggle sidebar"
					className="border border-divider"
				>
					<FuseSvgIcon>heroicons-outline:bars-3</FuseSvgIcon>
				</IconButton>
			)}

			<div className="flex flex-1 flex-col">
				<PageBreadcrumb maxItems={3} />

				<Typography className="text-4xl font-extrabold leading-none tracking-tight mb-1">
					Page heading
				</Typography>
			</div>

			{rightSidebarToggle && (
				<IconButton
					onClick={rightSidebarToggle}
					aria-label="toggle sidebar"
					className="border border-divider"
				>
					<FuseSvgIcon>heroicons-outline:bars-3</FuseSvgIcon>
				</IconButton>
			)}
		</div>
	);
}

export default DemoHeader;
