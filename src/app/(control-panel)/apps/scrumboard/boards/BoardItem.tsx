import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Card from '@mui/material/Card';
import { AvatarGroup } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { formatDistance } from 'date-fns';
import _ from 'lodash';
import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
import { alpha } from '@mui/system/colorManipulator';
import { ScrumboardBoard, useGetScrumboardMembersQuery } from '../ScrumboardApi';

type BoardItemProps = {
	board: ScrumboardBoard;
};

/**
 * The board item component.
 */
function BoardItem(props: BoardItemProps) {
	const { board } = props;

	const { data: members } = useGetScrumboardMembersQuery();

	const boardMembers = board?.members?.map((id) => _.find(members, { id }));

	return (
		<Card
			component={NavLinkAdapter}
			to={`/apps/scrumboard/boards/${board.id}`}
			role="button"
			className="flex flex-col items-start w-full h-full p-6 shadow-sm rounded-lg hover:shadow-xl transition-shadow duration-150 ease-in-out"
		>
			<div className="flex flex-col flex-auto justify-start items-start w-full">
				<Box
					sx={{
						backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.08),
						color: 'secondary.main'
					}}
					className="flex items-center justify-center p-4 rounded-full"
				>
					<FuseSvgIcon>{board.icon}</FuseSvgIcon>
				</Box>

				<Typography className="mt-5 text-lg font-medium leading-5">{board.title}</Typography>

				<Typography className="mt-0.5 line-clamp-2 text-secondary">{board.description}</Typography>

				<Divider className="w-12 mt-6 h-0.5" />
			</div>

			<div className="flex flex-col flex-auto justify-end w-full">
				{Boolean(boardMembers?.length) && (
					<div className="flex items-center mt-6 -space-x-1.5">
						<AvatarGroup max={4}>
							{boardMembers.map((member, index) => (
								<Avatar
									key={index}
									alt="member"
									src={member?.avatar}
								/>
							))}
						</AvatarGroup>
					</div>
				)}

				<div className="flex items-center mt-6 text-md font-md">
					<Typography color="text.secondary">Edited:</Typography>
					<Typography className="mx-1 truncate">
						{formatDistance(new Date(board.lastActivity), new Date(), { addSuffix: true })}
					</Typography>
				</div>
			</div>
		</Card>
	);
}

export default BoardItem;
