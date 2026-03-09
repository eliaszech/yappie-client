import { useQuery } from '@tanstack/react-query';
import {fetchFriends} from "../services/api.js";
import {useAuth} from "./useAuth.js";

export function useUsersWithPresence({queryKey}) {
    const {user} = useAuth();

    const { data: users = [], isLoading, isError, refetch } = useQuery({
        queryKey: [queryKey],
        queryFn: () => fetchFriends(user.id),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    const { data: presence = {} } = useQuery({
        queryKey: ['presence'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

    const usersWithPresence = users.map(user => ({
        ...user,
        online: presence[user.id] !== undefined ? presence[user.id] : user.online,
    }));

    return { users: usersWithPresence, isLoading, isError, refetch };
}