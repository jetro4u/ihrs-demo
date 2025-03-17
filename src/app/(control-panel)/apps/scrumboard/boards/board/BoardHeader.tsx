import Button from '@mui/material/Button';
import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import BoardTitle from './BoardTitle';
import BoardSettingsPopover from './popovers/settings/BoardSettingsPopover';

/**
 * The board header component.
 */
function BoardHeader() {
	return (
		<div className="p-6 sm:p-8 w-full flex items-center sm:justify-between">
			<div className="flex flex-col">
				<PageBreadcrumb
					maxItems={3}
					className="mb-2"
				/>
				<BoardTitle />
			</div>

			<div className="flex flex-1 items-center justify-end space-x-0 sm:space-x-3">
				<Button
					className="whitespace-nowrap"
					component={NavLinkAdapter}
					to="/apps/scrumboard/boards/"
				>
					<FuseSvgIcon size={20}>heroicons-outline:view-columns</FuseSvgIcon>
					<span className="hidden sm:flex mx-2">Boards</span>
				</Button>

				<BoardSettingsPopover />
			</div>
		</div>
	);
}

export default BoardHeader;
