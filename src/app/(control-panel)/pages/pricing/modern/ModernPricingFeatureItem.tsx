import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import ModernPricingItemType from './ModernPricingItemType';

type ModernPricingFeatureItemProps = {
	title?: ModernPricingItemType['title'];
	subtitle?: ModernPricingItemType['subtitle'];
	icon?: ModernPricingItemType['icon'];
};

/**
 * The modern pricing feature item component.
 */
function ModernPricingFeatureItem(props: ModernPricingFeatureItemProps) {
	const { title = '', subtitle = '', icon = '' } = props;

	return (
		<div>
			<Box
				className="flex h-12 w-12 items-center justify-center rounded-sm"
				sx={{ backgroundColor: 'secondary.main', color: 'secondary.contrastText' }}
			>
				<FuseSvgIcon>{icon}</FuseSvgIcon>
			</Box>
			<Typography className="mt-4 text-xl font-medium">{title}</Typography>
			<Typography
				className="leading-[2] mt-2"
				color="text.secondary"
			>
				{subtitle}
			</Typography>
		</div>
	);
}

export default ModernPricingFeatureItem;
