'use client';

import Typography from '@mui/material/Typography';
import { darken, lighten, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { SyntheticEvent, useState } from 'react';
import Paper from '@mui/material/Paper';
import _ from 'lodash';
import Button from '@mui/material/Button';
import Link from '@fuse/core/Link';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import GlobalStyles from '@mui/material/GlobalStyles';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import { LayoutOptionType } from '../types/OverviewsType';

const Root = styled('div')(() => ({
	'& .FusePageSimple-header': {},

	'&.scroll-normalScroll': {
		'& .preview-wrapper': {
			overflow: 'auto'
		},

		'& .preview-component': {
			minHeight: 'auto'
		}
	},
	'&.scroll-pageScroll': {
		'& .preview-component': {
			minHeight: '0',
			overflow: 'auto',
			'& .FusePageSimple-root': {
				minHeight: 'auto'
			},
			'& .FusePageCarded-root': {
				minHeight: 'auto'
			}
		}
	},
	'&.scroll-contentScroll': {
		'& .preview-component': {
			minHeight: '0'
		}
	}
}));

type PageLayoutOverviewProps = {
	layoutOptions: LayoutOptionType;
};

/**
 * The PageLayoutOverview page.
 */
function PageLayoutOverview(props: PageLayoutOverviewProps) {
	const { layoutOptions } = props;

	const { title, description, availableOptions = [], selectedOption: defaultSelectedOption, options } = layoutOptions;

	const [selectedOption, setSelectedOption] = useState(defaultSelectedOption);

	const SelectedComponent = options[selectedOption]?.component ? options[selectedOption]?.component : () => null;

	function handleTabChange(_ev: SyntheticEvent, val: number) {
		setSelectedOption(availableOptions[val].value);
	}

	return (
		<>
			<GlobalStyles
				styles={() => ({
					'#fuse-main': {
						height: 'auto!important',
						overflow: 'auto!important'
					}
				})}
			/>
			<Root className={`scroll-${selectedOption}`}>
				<div className="flex flex-col mb-6">
					<Typography className="text-4xl font-extrabold leading-none tracking-tight mb-1">
						{title}
					</Typography>
					<Typography
						className="text-lg"
						color="text.secondary"
					>
						{description}
					</Typography>

					<div className="mt-6">
						<FuseTabs
							value={availableOptions.indexOf(_.find(availableOptions, { value: selectedOption }))}
							onChange={handleTabChange}
						>
							{availableOptions.map((option) => (
								<FuseTab
									key={option.value}
									label={option.title}
								/>
							))}
						</FuseTabs>
					</div>
				</div>
				<div className="w-full">
					<Paper className="preview-wrapper z-20 relative h-3xl w-full rounded-xl shadow-xl flex flex-auto min-h-full overflow-hidden border">
						<Box
							className="preview-navbar hidden md:block sticky top-0 shrink-0 min-w-56 h-192 border-r z-20"
							sx={(theme) => ({
								backgroundColor: lighten(theme.palette.background.default, 0.02),
								...theme.applyStyles('light', {
									backgroundColor: lighten(theme.palette.background.default, 0.4)
								})
							})}
						>
							<div className="h-4" />

							<Box
								className="w-2/3 h-4 m-6 rounded-sm"
								sx={{
									backgroundColor: (theme) => darken(theme.palette.background.default, 0.1)
								}}
							/>

							<Box
								className="w-3/4 h-4 m-6 rounded-sm"
								sx={{
									backgroundColor: (theme) => darken(theme.palette.background.default, 0.1)
								}}
							/>
							<Box
								className="w-1/2 h-4 m-6 rounded-sm"
								sx={{
									backgroundColor: (theme) => darken(theme.palette.background.default, 0.1)
								}}
							/>
							<Box
								className="w-2/3 h-4 m-6 rounded-sm"
								sx={{
									backgroundColor: (theme) => darken(theme.palette.background.default, 0.1)
								}}
							/>
						</Box>

						<div className="flex flex-col flex-auto">
							<Box
								className="preview-header relative z-20 flex shrink-0 items-center justify-end h-16 px-6 sm:px-10 border-b"
								sx={(theme) => ({
									backgroundColor: lighten(theme.palette.background.default, 0.02),
									...theme.applyStyles('light', {
										backgroundColor: lighten(theme.palette.background.default, 0.4)
									})
								})}
							>
								<Box
									className="w-6 h-6 rounded-full"
									sx={{
										backgroundColor: (theme) => darken(theme.palette.background.default, 0.1)
									}}
								/>
							</Box>

							<div className="preview-component relative flex flex-col flex-auto z-10">
								<SelectedComponent />
							</div>

							<Box
								className="preview-footer relative z-20 flex shrink-0 items-center h-14 px-6 sm:px-10 border-t"
								sx={(theme) => ({
									backgroundColor: lighten(theme.palette.background.default, 0.02),
									...theme.applyStyles('light', {
										backgroundColor: lighten(theme.palette.background.default, 0.4)
									})
								})}
							>
								<Box
									className="w-32 h-4 rounded-full"
									sx={{
										backgroundColor: (theme) => darken(theme.palette.background.default, 0.1)
									}}
								/>
							</Box>
						</div>
					</Paper>

					<div className="flex items-center justify-between my-8">
						<div>
							<Typography>{options[selectedOption].description}</Typography>
							<Typography
								component="code"
								className="mt-1 text-md"
							>
								{options[selectedOption].link}/
							</Typography>
						</div>
						{options[selectedOption]?.link && (
							<Button
								color="secondary"
								variant="contained"
								component={Link}
								to={options[selectedOption].link}
								startIcon={
									<FuseSvgIcon size={20}>heroicons-solid:arrow-top-right-on-square</FuseSvgIcon>
								}
							>
								View
							</Button>
						)}
					</div>
				</div>
			</Root>
		</>
	);
}

export default PageLayoutOverview;
