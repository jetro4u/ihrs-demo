import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';

/**
 * The analytics dashboard app header.
 */
function AnalyticsDashboardAppHeader() {
	return (
		<div className="flex w-full container">
			<div className="flex flex-col sm:flex-row flex-auto sm:items-center min-w-0 p-6 md:p-8 pb-0 md:pb-0">
				<div className="flex flex-col flex-auto">
					<PageBreadcrumb className="mb-2" />
					<Typography className="text-3xl font-semibold tracking-tight leading-8">
						Analytics dashboard
					</Typography>
					<Typography
						className="font-medium tracking-tight"
						color="text.secondary"
					>
						Monitor metrics, check reports and review performance
					</Typography>
				</div>
				<div className="flex items-center mt-6 sm:mt-0 sm:mx-2 space-x-2">
					<Button
						className="whitespace-nowrap"
						startIcon={<FuseSvgIcon size={20}>heroicons-solid:cog-6-tooth</FuseSvgIcon>}
						variant="contained"
						color="primary"
					>
						Settings
					</Button>
					<Button
						className="whitespace-nowrap"
						variant="contained"
						color="secondary"
						startIcon={<FuseSvgIcon size={20}>heroicons-solid:arrow-up-tray</FuseSvgIcon>}
					>
						Export
					</Button>
				</div>
			</div>
		</div>
	);
}

export default AnalyticsDashboardAppHeader;
