import { useState, useCallback, useMemo } from 'react';
import { ContextMenuContext } from './ContextMenuContext.jsx';
import ContextMenu from '../features/components/ContextMenu.jsx';

export function ContextMenuProvider({ children }) {
    const [menu, setMenu] = useState(null);

    const openContextMenu = useCallback((e, items) => {
        e.preventDefault();
        e.stopPropagation();
        setMenu({ x: e.clientX, y: e.clientY, items });
    }, []);

    const closeContextMenu = useCallback(() => setMenu(null), []);

    const value = useMemo(() => ({ openContextMenu, closeContextMenu }), [openContextMenu, closeContextMenu]);

    return (
        <ContextMenuContext.Provider value={value}>
            {children}
            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    items={menu.items}
                    onClose={closeContextMenu}
                />
            )}
        </ContextMenuContext.Provider>
    );
}
