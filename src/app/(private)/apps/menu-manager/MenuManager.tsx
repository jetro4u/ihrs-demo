import { FC } from 'react';
import MenuManagement from './MenuManagement/index.jsx';
import i18n from '@domspec/i18n';
import { Box, Typography } from '@mui/material';

const MenuManager: FC = () => (
    <Box className="max-w-xl mx-auto p-8">
        <header>
            <Typography variant="h4" className="mb-2">
                {i18n.t('Apps Menu Manager')}
            </Typography>
            <Typography variant="body1" className="text-gray-700">
                {i18n.t('Drag and drop the menu items to re-order them.')}
            </Typography>
        </header>
        <MenuManagement />
    </Box>
);

export default MenuManager;