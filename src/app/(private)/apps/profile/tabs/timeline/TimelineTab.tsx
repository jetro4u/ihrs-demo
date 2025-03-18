import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { lighten } from '@mui/material/styles';
import Box from '@mui/material/Box';
import TImelineActivities from './TImelineActivities';
import TimelinePosts from './TimelinePosts';

/**
 * The timeline tab.
 */
function TimelineTab() {
	const container = {
		show: {
			transition: {
				staggerChildren: 0.04
			}
		}
	};

	const item = {
		hidden: { opacity: 0, y: 40 },
		show: { opacity: 1, y: 0 }
	};

	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="show"
			className="w-full"
		>
			<div className="md:flex">
				<div className="flex flex-col w-full md:w-80 md:ltr:mr-8 md:rtl:ml-8">
					<Card
						component={motion.div}
						variants={item}
						className="flex flex-col w-full px-8 pt-6"
					>
						<div className="flex justify-between items-center pb-4">
							<Typography className="text-2xl font-semibold leading-[1.25]">Latest Activity</Typography>
							<Button
								color="inherit"
								size="small"
								className="font-medium -mx-2"
							>
								See All
							</Button>
						</div>

						<CardContent className="p-0">
							<TImelineActivities />
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col flex-1">
					<Card
						component={motion.div}
						variants={item}
						className="w-full overflow-hidden w-full mb-8"
					>
						<Input
							className="p-6 w-full"
							classes={{ root: 'text-base' }}
							placeholder="Write something.."
							multiline
							rows="6"
							margin="none"
							disableUnderline
						/>
						<Box
							className="card-footer flex items-center flex-row border-t-1 px-6 py-3"
							sx={(theme) => ({
								backgroundColor: lighten(theme.palette.background.default, 0.02),
								...theme.applyStyles('light', {
									backgroundColor: lighten(theme.palette.background.default, 0.4)
								})
							})}
						>
							<div className="flex flex-1 items-center">
								<IconButton aria-label="Add photo">
									<FuseSvgIcon size={20}>heroicons-solid:photo</FuseSvgIcon>
								</IconButton>
								<IconButton aria-label="Mention somebody">
									<FuseSvgIcon size={20}>heroicons-solid:user</FuseSvgIcon>
								</IconButton>
								<IconButton aria-label="Add location">
									<FuseSvgIcon size={20}>heroicons-solid:map-pin</FuseSvgIcon>
								</IconButton>
							</div>
							<div>
								<Button
									variant="contained"
									color="secondary"
									size="small"
									aria-label="post"
								>
									Post
								</Button>
							</div>
						</Box>
					</Card>
					<TimelinePosts />
				</div>
			</div>
		</motion.div>
	);
}

export default TimelineTab;
