import { useContext } from 'react';
import { ContextMenuContext } from '../context/ContextMenuContext.jsx';

export function useContextMenu() {
    return useContext(ContextMenuContext);
}
