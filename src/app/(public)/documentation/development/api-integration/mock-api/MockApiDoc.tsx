import Typography from '@mui/material/Typography';
import { RedocStandalone } from 'redoc';
import { styled } from '@mui/material/styles';
import { RedocRawOptions } from 'redoc/typings/services/RedocNormalizedOptions';
import mockApiJson from 'src/@mock-utils/mockOpenApiSpecs.json';
import Box from '@mui/material/Box';
import Link from '@fuse/core/Link';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { Button } from '@mui/material';

const Root = styled('div')(() => ({
	'& .menu-content': {
		top: '64px!important'
		// bottom: 64,
		// height: 'calc(100vh - 128px)!important'
	}
}));

/**
 * Mock API Doc
 * This document provides information on how to use the mock API.
 */
function MockApiDoc() {
	return (
		<Root className="w-full">
			<Box
				sx={{ backgroundColor: 'background.default' }}
				className="flex items-center px-4 sticky top-0 h-16 z-10"
			>
				<div className="flex flex-1 items-center">
					<Typography
						variant="h6"
						className="font-bold"
					>
						Mock API Definitions (OpenAPI 3.0)
					</Typography>
				</div>
				<div className="flex shrink justify-end items-center space-x-1">
					<Button
						className="whitespace-nowrap"
						component={Link}
						to="/documentation"
						variant="contained"
						startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-turn-left-up</FuseSvgIcon>}
						color="primary"
						size="small"
					>
						Back
					</Button>
				</div>
			</Box>

			<div className="sticky top-16 w-full not-prose">
				<RedocStandalone
					spec={mockApiJson as object}
					options={
						{
							layout: 'stacked',
							hideHostname: true,
							hideInfoSection: true,
							hideInfoDescription: true,
							hideDownloadButton: true,
							noAutoAuth: true,
							hideLoading: true,
							nativeScrollbars: true,
							expandResponses: '',
							jsonSampleExpandLevel: 1,
							sortOperationsAlphabetically: true,
							sortPropsAlphabetically: true,
							sortTagsAlphabetically: true,
							pathInMiddlePanel: true
						} as RedocRawOptions
					}
				/>
			</div>
		</Root>
	);
}

export default MockApiDoc;
