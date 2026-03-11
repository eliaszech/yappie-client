import {useQuery, useQueryClient} from "@tanstack/react-query";

export function useReplyState(roomId) {
    const queryClient = useQueryClient();

    const { data: replyTo = null } = useQuery({
        queryKey: ['reply', roomId],
        queryFn: () => null,
        staleTime: Infinity,
    });

    function setReplyState(message) {
        queryClient.setQueryData(['reply', roomId], message);
    }

    function clearReplyState() {
        queryClient.setQueryData(['reply', roomId], null);
    }

    return { replyTo, setReplyState, clearReplyState };
}
