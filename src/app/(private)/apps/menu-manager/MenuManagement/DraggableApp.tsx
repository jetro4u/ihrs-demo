import { FC, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useTranslation } from '@domspec/i18n';

interface AppProps {
    translation: any;
    defaultAction: string;
    name: string;
    icon: string;
    iconColor: 'inherit' | 'disabled' | 'primary' | 'secondary' | 'action' | 'error' | 'info' | 'success' | 'warning';
    url: string;
}

const App: FC<AppProps> = ({ translation, defaultAction, name, icon, iconColor, url }) => (
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
                {translation(name)}
            </div>
        </a>
    </motion.div>
    /*
    <a 
        href={defaultAction} 
        className="flex flex-col items-center justify-center w-24 m-4 p-4 rounded-lg text-black no-underline cursor-pointer hover:bg-gray-100"
    >
        <img className="w-12 h-12 cursor-pointer" src={icon} alt={name} />
        <div className="mt-3 text-sm font-medium text-center cursor-pointer">{name}</div>
    </a>
    */
);

const DND_ITEM_TYPE = 'APP';

interface DraggableAppProps {
    app: AppProps;
    onDrag: (from: string, to: string) => void;
    onDrop: () => void;
}

const DraggableApp: FC<DraggableAppProps> = ({ app, onDrag, onDrop }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    
    const [{ isDragging }, connectDrag] = useDrag({
        type: DND_ITEM_TYPE,
        item: { name: app.name },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        end: onDrop,
    });

    const [, connectDrop] = useDrop({
        accept: DND_ITEM_TYPE,
        hover(item: { name: string }) {
            if (item.name !== app.name) {
                onDrag(item.name, app.name);
            }
        },
    });

    connectDrag(ref);
    connectDrop(ref);

    return (
        <motion.div 
            ref={ref} 
            className={classNames("transition-opacity", { 'opacity-0': isDragging })}
        >
            <App translation={t} {...app} />
        </motion.div>
    );
};

export default DraggableApp;