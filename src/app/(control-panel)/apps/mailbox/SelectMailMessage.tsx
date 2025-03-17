import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

/**
 * The select mail message.
 */
function SelectMailMessage() {
	return (
		<div className="flex flex-col flex-1 items-center justify-center p-6">
			<FuseSvgIcon
				className="icon-size-32 mb-4"
				color="disabled"
			>
				heroicons-outline:envelope
			</FuseSvgIcon>
			<Typography
				className="mt-4 text-2xl font-semibold tracking-tight"
				color="text.secondary"
			>
				Select a mail to read
			</Typography>
		</div>
	);
}

export default SelectMailMessage;
