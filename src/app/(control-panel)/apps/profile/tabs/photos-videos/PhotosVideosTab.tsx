import Albums from './Albums';

/**
 * The photos videos tab.
 */
function PhotosVideosTab() {
	return (
		<div className="md:flex w-full">
			<div className="flex flex-col flex-1 md:ltr:pr-8 md:rtl:pl-8">
				<Albums />
			</div>
		</div>
	);
}

export default PhotosVideosTab;
