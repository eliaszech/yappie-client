import { useEffect } from 'react';
import { useReadStatesQuery } from './useReadStates.js';
import { setBadgeCount } from '../services/notifications.js';

export function useBadgeCount() {
    const { data } = useReadStatesQuery();

    useEffect(() => {
        if (!data) return;
        const mentionTotal = (data.channels || []).reduce((sum, c) => sum + (c.mentionCount || 0), 0);
        const dmTotal = (data.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setBadgeCount(mentionTotal + dmTotal);
    }, [data]);
}
