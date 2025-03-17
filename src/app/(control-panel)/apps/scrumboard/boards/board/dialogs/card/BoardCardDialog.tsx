import Dialog from '@mui/material/Dialog';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { closeCardDialog, selectCardDialogOpen } from '../../../../scrumboardSlice';
import BoardCardForm from './BoardCardForm';

/**
 * The board card dialog component.
 */
function BoardCardDialog() {
	const dispatch = useAppDispatch();
	const cardDialogOpen = useAppSelector(selectCardDialogOpen);

	return (
		<Dialog
			classes={{
				paper: 'max-w-2xl w-full m-2 sm:m-6'
			}}
			onClose={() => dispatch(closeCardDialog())}
			open={cardDialogOpen}
		>
			<BoardCardForm />
		</Dialog>
	);
}

export default BoardCardDialog;
