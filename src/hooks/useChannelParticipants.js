import { useQuery } from '@tanstack/react-query';
import {fetchChannelParticipants} from '../services/api';

export function useChannelParticipants(channelId) {
    const { data: participants = [] } = useQuery({
        queryKey: ['voice-participants', channelId],
        queryFn: () => fetchChannelParticipants(channelId),
        staleTime: Infinity,
        refetchOnMount: false,
    });

    return participants;
}