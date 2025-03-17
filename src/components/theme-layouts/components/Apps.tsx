import { MouseEvent, useState, useCallback } from 'react';
import { Menu, TextField, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
//import { useTranslation } from '@domspec/i18n';
import { AppInfo } from '@/configs/defaultAppsInfo';

function escapeRegExpCharacters(text: string): string {
    return text.replace(/[/.*+?^${}()|[\]\\]/g, '\\$&');
}

interface SearchProps {
    value: string;
    onChange: (value: string) => void;
}

const Search = ({ value, onChange }: SearchProps): JSX.Element => {
    //const { t } = useTranslation();

    return (
        <div className="flex items-center h-[52px] m-2 gap-2">
            <div className="flex-grow">
                <TextField
                    value={value}
                    name="filter"
                    placeholder={'Search apps'}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus
                    fullWidth
                    variant="outlined"
                    size="small"
                />
            </div>
            <div>
                <IconButton
                    component="a"
                    href="/apps/menu-manager"
                    className={clsx('border border-divider')}
                    aria-controls="font-size-menu"
                    aria-haspopup="true"
                    data-test="toolbar-apps-icon"
                >
                    <FuseSvgIcon size={20}>material-outline:settings</FuseSvgIcon>
                </IconButton>
            </div>
        </div>
    );
};

interface ItemProps {
    name: string;
    icon: string;
    iconColor: 'inherit' | 'disabled' | 'primary' | 'secondary' | 'action' | 'error' | 'info' | 'success' | 'warning';
    url: string;
}

const Item: React.FC<ItemProps> = ({ name, icon, iconColor, url }) => {
    const { t } = useTranslation();
    
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <a 
                href={url}
                className="inline-block flex flex-col items-center justify-center w-24 m-2 rounded-xl hover:bg-blue-50 focus:bg-blue-50 no-underline cursor-pointer"
            >
                <div className="w-12 h-12 m-2 cursor-pointer">
                    <FuseSvgIcon size={48} color={iconColor}>{icon}</FuseSvgIcon>
                </div>
                <div className="break-words mt-3.5 text-gray-900 text-xs leading-[14px] text-center cursor-pointer">
                    {name}
                </div>
            </a>
        </motion.div>
    );
};

interface ListProps {
    appsInfo: AppInfo[];
    filter: string;
}

const List: React.FC<ListProps> = ({ appsInfo, filter }) => (
    <div 
        className="flex flex-wrap content-start items-start justify-evenly w-[20vw] min-w-[300px] max-w-[560px] min-h-[200px] max-h-[465px] mb-2 px-4 overflow-auto overflow-x-hidden"
        data-test="headerbar-apps-menu-list"
    >
        {appsInfo
            .filter(({ name }) => {
                const formattedAppName = name.toLowerCase();
                const formattedFilter = escapeRegExpCharacters(filter).toLowerCase();
                return filter.length > 0 ? formattedAppName.match(formattedFilter) : true;
            })
            .map(({ name, icon, iconColor, url }, idx) => (
                <Item
                    key={`app-${name}-${idx}`}
                    name={name}
                    icon={icon}
                    iconColor={iconColor}
                    url={url}
                />
            ))}
    </div>
);

interface AppsProps {
    appsInfo: AppInfo[];
}

const Apps: React.FC<AppsProps> = ({ appsInfo }) => {
    const [filter, setFilter] = useState('');
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleFilterChange = useCallback((value: string) => setFilter(value), []);

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <IconButton
				onClick={handleClick}
                className={clsx('border border-divider')}
                aria-controls="font-size-menu"
                aria-haspopup="true"
                data-test="toolbar-apps-icon"
            >
                <FuseSvgIcon size={32}>material-outline:apps</FuseSvgIcon>
            </IconButton>
			<Menu
				classes={{ paper: 'w-80' }}
				id="font-size-menu"
				anchorEl={anchorEl}
				keepMounted
				open={Boolean(anchorEl)}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'center'
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'center'
				}}
			>
				<div className="px-6 py-3">
                    <Search value={filter} onChange={handleFilterChange} />
                    <List appsInfo={appsInfo} filter={filter} />
				</div>
			</Menu>
        </div>
    );
};

export default Apps;