import Typography from '@mui/material/Typography';
import clsx from 'clsx';

type IHRSSidebarHeaderProps = {
	className?: string;
};

function IHRSSidebarHeader(props: IHRSSidebarHeaderProps) {
	const { className = '' } = props;

	return (
		<div className={clsx('flex items-center space-x-2', className)}>
			<img
				className="logo-icon h-8 w-8"
				src="/assets/images/logo/logo.svg"
				alt="logo"
			/>
			<div className="logo-text flex flex-col flex-auto">
				<Typography className="text-2xl tracking-light font-semibold leading-none">IHRS</Typography>
				<Typography
					className="text-xl tracking-light font-bold leading-none"
					color="primary"
				>
					APP
				</Typography>
			</div>
		</div>
	);
}

export default IHRSSidebarHeader;
