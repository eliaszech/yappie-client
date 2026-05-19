import { useQuery } from '@tanstack/react-query';

export function useUsersWithPresence({queryKey = ['users'], fetchFunction, getUserId = (item) => item.id, enabled = true}) {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: queryKey,
        queryFn: fetchFunction,
        staleTime: 10 * 60 * 1000,
        retry: 1,
        enabled,
    });

    const { data: presence = {} } = useQuery({
        queryKey: ['presence'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

    // apiRequest returns an error object ({status, error}) on non-2xx — most
    // commonly when the user just lost VIEW_CHANNEL on the active channel
    // and the redirect hasn't fired yet. Guard so .map doesn't crash.
    const users = Array.isArray(data) ? data : [];

    const usersWithPresence = users.map(item => {
        const userId = getUserId(item);
        const presenceData = presence[userId];
        const onlineStatus = presenceData?.online !== undefined ? presenceData.online : (item.online ?? item.user?.online);
        const userStatus = presenceData?.status || item.status || item.user?.status || 'offline';

        return {
            ...item,
            online: onlineStatus,
            status: userStatus,
            user: item.user ? { ...item.user, online: onlineStatus, status: userStatus } : undefined,
        };
    });

    return { users: usersWithPresence, isLoading, isError, refetch };
}