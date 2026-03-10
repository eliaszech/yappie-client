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
        const onlineStatus = presence[userId] !== undefined ? presence[userId] : (item.online ?? item.user?.online);
        return {
            ...item,
            online: onlineStatus,
            user: item.user ? { ...item.user, online: onlineStatus } : undefined,
        };
    });

    return { users: usersWithPresence, isLoading, isError, refetch };
}