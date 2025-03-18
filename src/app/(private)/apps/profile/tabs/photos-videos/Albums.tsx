import FuseLoading from '@fuse/core/FuseLoading';
import { motion } from 'motion/react';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { useGetProfileAlbumsQuery } from '../../ProfileApi';
import Album from './Album';

function Albums() {
	const { data: albums, isLoading } = useGetProfileAlbumsQuery();

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

	if (isLoading) {
		return <FuseLoading />;
	}

	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="show"
			className="w-full"
		>
			{albums.map((album) => (
				<div
					key={album.id}
					className="mb-12"
				>
					<ListSubheader
						component={motion.div}
						variants={item}
						className="flex items-center px-0 mb-6 bg-transparent"
					>
						<Typography className="text-2xl font-semibold leading-[1.25]">{album.name}</Typography>
						<Typography
							className="mx-3 font-medium leading-[1.25]"
							color="text.secondary"
						>
							{album.info}
						</Typography>
					</ListSubheader>

					<div className="overflow-hidden flex flex-wrap -m-2">
						<Album album={album} />
					</div>
				</div>
			))}
		</motion.div>
	);
}

export default Albums;
