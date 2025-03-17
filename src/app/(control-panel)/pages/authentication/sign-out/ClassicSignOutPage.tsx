import Typography from '@mui/material/Typography';
import Link from '@fuse/core/Link';
import Paper from '@mui/material/Paper';

/**
 * The sign out page.
 */
function ClassicSignOutPage() {
	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
			<Paper className="flex min-h-full w-full items-center rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
				<div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
					<img
						className="mx-auto w-12"
						src="/assets/images/logo/logo.svg"
						alt="logo"
					/>

					<Typography className="mt-8 text-center text-4xl font-extrabold leading-[1.25] tracking-tight">
						You have signed out!
					</Typography>
					<Typography className="mt-0.5 flex justify-center font-medium">Redirecting in 5 seconds</Typography>

					<Typography
						className="mt-8 text-center text-md font-medium"
						color="text.secondary"
					>
						<span>Go to</span>
						<Link
							className="ml-1"
							to="/sign-in"
						>
							sign in
						</Link>
					</Typography>
				</div>
			</Paper>
		</div>
	);
}

export default ClassicSignOutPage;
