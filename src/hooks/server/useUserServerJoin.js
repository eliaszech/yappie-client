import {useQueryClient} from "@tanstack/react-query";
import {useEffect} from "react";
import {onUserJoinedServer} from "../../services/socket.js";

export function useUserServerJoin() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onUserJoinedServer((member) => {
            queryClient.setQueryData(['members', member.serverId], (old) => {
                if (!old) return old;
                if (old.some(m => m.user?.id === member.user?.id)) return old;
                return [...old, member];
            });
        });

        return () => onUserJoinedServer(null);
    }, [queryClient]);
}