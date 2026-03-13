import { useQuery } from '@tanstack/react-query';

export function useUsersWithPresence({queryKey = ['users'], fetchFunction, getUserId = (item) => item.id}) {
    const { data: users = [], isLoading, isError, refetch } = useQuery({
        queryKey: queryKey,
        queryFn: fetchFunction,
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    const { data: presence = {} } = useQuery({
        queryKey: ['presence'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

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