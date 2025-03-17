import {
    useDataMutation
} from '@domspec/data-service'
import { useAlert } from '@domspec/alert'
import { Card } from '@domspec/d3-ui'
import PropTypes from 'prop-types'
import { useState, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import i18n from '@domspec/i18n'
import DraggableApp from './DraggableApp.jsx'
import classes from './MenuManagement.module.css'
import { defaultAppsInfo } from '@/configs/defaultAppsInfo';

const mutation = {
    resource: 'menu',
    type: 'create',
    data: ({ items }) => items,
}

const moveApp = (apps, app, target) => {
    const appIndex = apps.indexOf(app)
    const targetIndex = apps.indexOf(target)
    const newApps = [...apps]
    newApps.splice(appIndex, 1)
    newApps.splice(targetIndex, 0, app)
    return newApps
}

const MenuManagement = ({ apps, initialAppsOrder }) => {
    const [appsOrder, setAppsOrder] = useState(initialAppsOrder)
    const { show: showSuccessfulUpdateAlert } = useAlert(
        i18n.t('Updated order of apps.'),
        { success: true }
    )
    const { show: showErrorUpdatingAlert } = useAlert((message) => message, {
        critical: true,
    })
    const [mutate] = useDataMutation(mutation, {
        onComplete() {
            showSuccessfulUpdateAlert()
        },
        onError(error) {
            showErrorUpdatingAlert(error.message)
        },
    })
    const handleAppDrag = useCallback(
        (app, target) => {
            const newAppsOrder = moveApp(appsOrder, app, target)
            setAppsOrder(newAppsOrder)
        },
        [appsOrder]
    )
    const handleAppDrop = useCallback(() => {
        mutate({ items: appsOrder })
    }, [appsOrder])

    return (
        <Card>
            <DndProvider backend={HTML5Backend}>
                <div className={classes.apps}>
                    {appsOrder.map((appName) => (
                        <DraggableApp
                            key={appName}
                            onDrag={handleAppDrag}
                            onDrop={handleAppDrop}
                            app={apps[appName]}
                        />
                    ))}
                </div>
            </DndProvider>
        </Card>
    )
}

MenuManagement.propTypes = {
    apps: PropTypes.object.isRequired,
    initialAppsOrder: PropTypes.array.isRequired,
}

const MenuManagementWrapper = () => {
    const apps = defaultAppsInfo.map((app) => ({ ...app }));

    const appsByName = {};
    apps.forEach((app) => {
        appsByName[app.name] = app;
    });

    return (
        <MenuManagement
            apps={appsByName}
            initialAppsOrder={apps.map(({ name }) => name)}
        />
    );
};

export default MenuManagementWrapper
