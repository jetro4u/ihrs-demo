import { Controller, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from '@fuse/core/Link';
import _ from 'lodash';
import Paper from '@mui/material/Paper';
import AvatarGroup from '@mui/material/AvatarGroup';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Form Validation Schema
 */
const schema = z
	.object({
		password: z
			.string()
			.nonempty('Please enter your password.')
			.min(8, 'Password is too short - should be 8 chars minimum.'),
		passwordConfirm: z.string().nonempty('Password confirmation is required')
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords must match',
		path: ['passwordConfirm']
	});

const defaultValues = {
	password: '',
	passwordConfirm: ''
};

/**
 * The modern reset password page.
 */
function ModernResetPasswordPage() {
	const { control, formState, handleSubmit, reset } = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

	function onSubmit() {
		reset(defaultValues);
	}

	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center md:p-8">
			<Paper className="flex min-h-full w-full overflow-hidden rounded-none sm:min-h-auto sm:w-auto sm:rounded-xl sm:shadow-sm md:w-full md:max-w-6xl">
				<div className="w-full px-4 py-8 ltr:border-r-1 rtl:border-l-1 sm:w-auto sm:p-12 md:p-16">
					<div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
						<img
							className="w-12"
							src="/assets/images/logo/logo.svg"
							alt="logo"
						/>

						<Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
							Reset your password
						</Typography>
						<Typography className="font-medium">Create a new password for your account</Typography>

						<form
							name="registerForm"
							noValidate
							className="mt-8 flex w-full flex-col justify-center"
							onSubmit={handleSubmit(onSubmit)}
						>
							<Controller
								name="password"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										className="mb-6"
										label="Password"
										type="password"
										error={!!errors.password}
										helperText={errors?.password?.message}
										variant="outlined"
										required
										fullWidth
									/>
								)}
							/>

							<Controller
								name="passwordConfirm"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										className="mb-6"
										label="Password (Confirm)"
										type="password"
										error={!!errors.passwordConfirm}
										helperText={errors?.passwordConfirm?.message}
										variant="outlined"
										required
										fullWidth
									/>
								)}
							/>

							<Button
								variant="contained"
								color="secondary"
								className=" mt-1 w-full"
								aria-label="Register"
								disabled={_.isEmpty(dirtyFields) || !isValid}
								type="submit"
								size="large"
							>
								Reset your password
							</Button>

							<Typography
								className="mt-8 text-md font-medium"
								color="text.secondary"
							>
								<span>Return to</span>
								<Link
									className="ml-1"
									to="/sign-in"
								>
									sign in
								</Link>
							</Typography>
						</form>
					</div>
				</div>

				<Box
					className="relative hidden h-full flex-auto items-center justify-center overflow-hidden p-16 md:flex lg:px-28"
					sx={{ backgroundColor: 'primary.dark', color: 'primary.contrastText' }}
				>
					<svg
						className="pointer-events-none absolute inset-0"
						viewBox="0 0 960 540"
						width="100%"
						height="100%"
						preserveAspectRatio="xMidYMax slice"
						xmlns="http://www.w3.org/2000/svg"
					>
						<Box
							component="g"
							className="opacity-5"
							fill="none"
							stroke="currentColor"
							strokeWidth="100"
						>
							<circle
								r="234"
								cx="196"
								cy="23"
							/>
							<circle
								r="234"
								cx="790"
								cy="491"
							/>
						</Box>
					</svg>
					<Box
						component="svg"
						className="absolute -right-16 -top-16 opacity-20"
						sx={{ color: 'primary.light' }}
						viewBox="0 0 220 192"
						width="220px"
						height="192px"
						fill="none"
					>
						<defs>
							<pattern
								id="837c3e70-6c3a-44e6-8854-cc48c737b659"
								x="0"
								y="0"
								width="20"
								height="20"
								patternUnits="userSpaceOnUse"
							>
								<rect
									x="0"
									y="0"
									width="4"
									height="4"
									fill="currentColor"
								/>
							</pattern>
						</defs>
						<rect
							width="220"
							height="192"
							fill="url(#837c3e70-6c3a-44e6-8854-cc48c737b659)"
						/>
					</Box>

					<div className="relative z-10 w-full max-w-4xl">
						<div className="text-7xl font-bold leading-none text-gray-100">
							<div>Welcome to</div>
							<div>our community</div>
						</div>
						<div className="mt-6 text-lg leading-6 tracking-tight text-gray-400">
							Fuse helps developers to build organized and well coded dashboards full of beautiful and
							rich modules. Join us and start building your application today.
						</div>
						<div className="mt-8 flex items-center">
							<AvatarGroup
								sx={{
									'& .MuiAvatar-root': {
										borderColor: 'primary.main'
									}
								}}
							>
								<Avatar src="/assets/images/avatars/female-18.jpg" />
								<Avatar src="/assets/images/avatars/female-11.jpg" />
								<Avatar src="/assets/images/avatars/male-09.jpg" />
								<Avatar src="/assets/images/avatars/male-16.jpg" />
							</AvatarGroup>

							<div className="ml-4 font-medium tracking-tight text-gray-400">
								More than 17k people joined us, it's your turn
							</div>
						</div>
					</div>
				</Box>
			</Paper>
		</div>
	);
}

export default ModernResetPasswordPage;
